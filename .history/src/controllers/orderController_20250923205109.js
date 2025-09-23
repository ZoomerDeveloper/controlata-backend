const { PrismaClient } = require('@prisma/client');
const costCalculationService = require('../services/costCalculationService');
const stockService = require('../services/stockService');
const logger = require('../utils/logger');

// Force cache invalidation - remove imageUrl field
const prisma = new PrismaClient();

const getAllOrders = async (req, res) => {
  try {
    logger.info('Getting all orders', { query: req.query });
    
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      status,
      search 
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    logger.debug('Where clause for orders', { where });

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          pictures: {
            include: {
              pictureSize: {
                select: {
                  id: true,
                  name: true,
                  width: true,
                  height: true
                }
              }
            }
          },
          incomes: {
            select: {
              id: true,
              amount: true,
              description: true
            }
          },
          _count: {
            select: {
              pictures: true
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get all orders error', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      query: req.query
    });
    
    res.status(500).json({
      error: 'Ошибка при получении заказов',
      details: error.message,
      code: error.code
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        pictures: {
          include: {
            pictureSize: {
              select: {
                id: true,
                name: true,
                width: true,
                height: true
              }
            },
            materials: {
              include: {
                material: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                    category: true
                  }
                }
              }
            }
          }
        },
        incomes: true
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Заказ не найден'
      });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({
      error: 'Ошибка при получении заказа'
    });
  }
};

const createOrder = async (req, res) => {
  try {
    const {
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      totalPrice,
      orderDate,
      dueDate,
      notes,
      pictures = []
    } = req.body;

    // Генерируем номер заказа с улучшенной системой нумерации
    const orderNumberingService = require('../services/orderNumberingService');
    const finalOrderNumber = orderNumber || await orderNumberingService.generateOrderNumber();

    // Рассчитываем общую стоимость, если не предоставлена
    let finalTotalPrice = totalPrice || 0;
    if (pictures && pictures.length > 0) {
      finalTotalPrice = pictures.reduce((sum, picture) => sum + (picture.price || 0), 0);
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: finalOrderNumber,
        customerName,
        customerEmail,
        customerPhone,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        totalPrice: finalTotalPrice,
        userId: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Создаем картины для заказа
    if (pictures && pictures.length > 0) {
      for (const pictureData of pictures) {
        let createdPicture;
        
        if (pictureData.type === 'READY_MADE' && pictureData.pictureId) {
          // Для готовых картин - копируем данные из существующей картины
          const existingPicture = await prisma.picture.findUnique({
            where: { id: pictureData.pictureId },
            include: {
              materials: {
                include: {
                  material: true
                }
              }
            }
          });
          
          if (existingPicture) {
            createdPicture = await prisma.picture.create({
              data: {
                orderId: order.id,
                pictureSizeId: existingPicture.pictureSizeId,
                name: existingPicture.name,
                description: existingPicture.description,
                type: existingPicture.type,
                price: pictureData.price || existingPicture.price,
                workHours: existingPicture.workHours,
                notes: existingPicture.notes,
                imageUrl: existingPicture.imageUrl
              }
            });

            // Копируем материалы (но НЕ списываем их со склада)
            if (existingPicture.materials && existingPicture.materials.length > 0) {
              for (const pictureMaterial of existingPicture.materials) {
                // Создаем связь материала с новой картиной
                await prisma.pictureMaterial.create({
                  data: {
                    pictureId: createdPicture.id,
                    materialId: pictureMaterial.materialId,
                    quantity: pictureMaterial.quantity
                  }
                });
              }
            }
          }
        } else if (pictureData.type === 'CUSTOM_PHOTO') {
          // Для картин по фото - создаем новую картину
          console.log('🔍 Создаем картину по фото:', {
            pictureSizeId: pictureData.pictureSizeId,
            name: pictureData.name,
            type: pictureData.type
          });
          
          // Проверим, существует ли pictureSizeId
          const pictureSize = await prisma.pictureSize.findUnique({
            where: { id: pictureData.pictureSizeId }
          });
          
          if (!pictureSize) {
            console.error('❌ PictureSize не найден:', pictureData.pictureSizeId);
            throw new Error(`Размер картины с ID ${pictureData.pictureSizeId} не найден`);
          }
          
          createdPicture = await prisma.picture.create({
            data: {
              orderId: order.id,
              pictureSizeId: pictureData.pictureSizeId,
              name: pictureData.name,
              description: pictureData.description,
              type: pictureData.type,
              price: pictureData.price,
              workHours: pictureData.workHours,
              notes: pictureData.notes,
              imageUrl: pictureData.imageUrl || null // Сохраняем URL изображения, если есть
            }
          });

          // Создаем стандартные материалы для картины по фото
          try {
            const pictureMaterialService = require('../services/pictureMaterialService');
            await pictureMaterialService.createStandardMaterialsForPicture(
              createdPicture.id,
              pictureData.pictureSizeId,
              'CUSTOM_PHOTO'
            );
            console.log('✅ Материалы созданы для картины по фото:', createdPicture.id);
          } catch (materialError) {
            console.error('❌ Ошибка создания материалов для картины по фото:', materialError);
            // Не прерываем создание заказа, только логируем ошибку
          }
        }
      }
    }

    // Получаем обновленный заказ с картинами
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        pictures: {
          include: {
            pictureSize: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Заказ успешно создан',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    logger.error('Create order error:', { 
      error: error.message, 
      stack: error.stack,
      body: req.body 
    });
    res.status(500).json({
      error: 'Ошибка при создании заказа',
      details: error.message
    });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerEmail,
      customerPhone,
      status,
      dueDate,
      notes,
      totalPrice
    } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(customerName !== undefined && { customerName }),
        ...(customerEmail !== undefined && { customerEmail }),
        ...(customerPhone !== undefined && { customerPhone }),
        ...(status && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(notes !== undefined && { notes }),
        ...(totalPrice !== undefined && { totalPrice }),
        ...(status === 'COMPLETED' && { completedAt: new Date() })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        pictures: {
          include: {
            pictureSize: true
          }
        }
      }
    });

    res.json({
      message: 'Заказ успешно обновлен',
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении заказа'
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, есть ли связанные доходы
    const incomesCount = await prisma.income.count({
      where: { orderId: id }
    });

    if (incomesCount > 0) {
      return res.status(400).json({
        error: 'Нельзя удалить заказ с привязанными доходами'
      });
    }

    await prisma.order.delete({
      where: { id }
    });

    res.json({
      message: 'Заказ успешно удален'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      error: 'Ошибка при удалении заказа'
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Получаем текущий заказ с картинами и материалами
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        pictures: {
          include: {
            materials: {
              include: {
                material: true
              }
            }
          }
        }
      }
    });

    if (!currentOrder) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(status === 'COMPLETED' && { completedAt: new Date() })
      },
      include: {
        pictures: {
          include: {
            materials: {
              include: {
                material: true
              }
            }
          }
        }
      }
    });

    // Списываем материалы при переходе в статус "В работе", "Завершен" или "Доставлен"
    if (['IN_PROGRESS', 'COMPLETED', 'DELIVERED'].includes(status)) {
      for (const picture of order.pictures) {
        // Если у картины нет материалов (например, для картин по фото), создаем их
        if (!picture.materials || picture.materials.length === 0) {
          if (picture.type === 'CUSTOM_PHOTO' && picture.pictureSizeId) {
            try {
              const pictureMaterialService = require('../services/pictureMaterialService');
              await pictureMaterialService.createStandardMaterialsForPicture(
                picture.id,
                picture.pictureSizeId,
                'CUSTOM_PHOTO'
              );
              console.log('✅ Материалы созданы для картины по фото при изменении статуса:', picture.id);
              
              // Перезагружаем картину с материалами
              const updatedPicture = await prisma.picture.findUnique({
                where: { id: picture.id },
                include: {
                  materials: {
                    include: {
                      material: true
                    }
                  }
                }
              });
              
              if (updatedPicture && updatedPicture.materials) {
                picture.materials = updatedPicture.materials;
              }
            } catch (materialError) {
              console.error('❌ Ошибка создания материалов для картины по фото:', materialError);
              // Продолжаем без прерывания
            }
          }
        }

        // Списываем материалы
        if (picture.materials && picture.materials.length > 0) {
          for (const pictureMaterial of picture.materials) {
            try {
              const warehouseService = require('../services/warehouseService');
              const result = await warehouseService.removeMaterialFromStock(
                pictureMaterial.materialId,
                pictureMaterial.quantity,
                `Изменение статуса заказа на: ${status}`,
                order.id,
                'ORDER',
                `Заказ: ${order.orderNumber}, Картина: ${picture.name}, Статус: ${status}`
              );

              if (result.isNegative) {
                logger.warn('Material stock went negative during status update', {
                  materialId: pictureMaterial.materialId,
                  quantity: pictureMaterial.quantity,
                  newQuantity: result.newQuantity,
                  orderId: order.id,
                  pictureId: picture.id,
                  status: status
                });
              }
            } catch (error) {
              logger.error('Error removing material from stock during status update', {
                materialId: pictureMaterial.materialId,
                quantity: pictureMaterial.quantity,
                orderId: order.id,
                pictureId: picture.id,
                status: status,
                error: error.message
              });
              // Не прерываем обновление статуса, только логируем ошибку
            }
          }
        }
      }
    }

    // Если заказ отменен, возвращаем материалы на склад
    if (status === 'CANCELLED') {
      for (const picture of order.pictures) {
        if (picture.materials && picture.materials.length > 0) {
          for (const pictureMaterial of picture.materials) {
            try {
              const warehouseService = require('../services/warehouseService');
              await warehouseService.addMaterialToStock(
                pictureMaterial.materialId,
                pictureMaterial.quantity,
                `Возврат материалов при отмене заказа: ${order.orderNumber}`,
                order.id
              );
            } catch (error) {
              logger.error('Error returning material to stock during cancellation', {
                materialId: pictureMaterial.materialId,
                quantity: pictureMaterial.quantity,
                orderId: order.id,
                pictureId: picture.id,
                error: error.message
              });
            }
          }
        }
      }
    }

    res.json({
      message: 'Статус заказа обновлен',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении статуса заказа'
    });
  }
};

const getOrdersByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const where = {
      ...(startDate && endDate && {
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(status && { status })
    };

    const orders = await prisma.order.findMany({
      where,
      include: {
        pictures: {
          include: {
            pictureSize: true
          }
        },
        incomes: true,
        _count: {
          select: {
            pictures: true
          }
        }
      },
      orderBy: { orderDate: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get orders by date range error:', error);
    res.status(500).json({
      error: 'Ошибка при получении заказов по датам'
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getOrdersByDateRange
};
