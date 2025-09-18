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

    // Генерируем номер заказа, если не предоставлен
    const finalOrderNumber = orderNumber || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

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
        if (pictureData.type === 'READY_MADE' && pictureData.pictureId) {
          // Для готовых картин - копируем данные из существующей картины
          const existingPicture = await prisma.picture.findUnique({
            where: { id: pictureData.pictureId }
          });
          
          if (existingPicture) {
            await prisma.picture.create({
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
          }
        } else if (pictureData.type === 'CUSTOM_PHOTO') {
          // Для картин по фото - создаем новую картину
          await prisma.picture.create({
            data: {
              orderId: order.id,
              pictureSizeId: pictureData.pictureSizeId,
              name: pictureData.name,
              description: pictureData.description,
              type: pictureData.type,
              price: pictureData.price,
              workHours: pictureData.workHours,
              notes: pictureData.notes,
              imageUrl: pictureData.photo // Сохраняем загруженное фото
            }
          });
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
    res.status(500).json({
      error: 'Ошибка при создании заказа'
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

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(status === 'COMPLETED' && { completedAt: new Date() })
      },
      include: {
        pictures: true
      }
    });

    // Если заказ отменен, возвращаем материалы на склад
    if (status === 'CANCELLED') {
      for (const picture of order.pictures) {
        await stockService.returnMaterialsToStock(picture.id);
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
