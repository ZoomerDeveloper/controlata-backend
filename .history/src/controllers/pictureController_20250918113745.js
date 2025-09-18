const { PrismaClient } = require('@prisma/client');
const costCalculationService = require('../services/costCalculationService');
const stockService = require('../services/stockService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const getAllPictures = async (req, res) => {
  try {
    logger.info('Getting all pictures', { query: req.query });
    
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      status,
      type,
      orderId,
      search 
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(status && { status }),
      ...(type && { type }),
      ...(orderId && { orderId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    logger.debug('Where clause for pictures', { where });

    const [pictures, total] = await Promise.all([
      prisma.picture.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              status: true
            }
          },
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
      }),
      prisma.picture.count({ where })
    ]);

    res.json({
      pictures,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get all pictures error', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      query: req.query
    });
    
    res.status(500).json({
      error: 'Ошибка при получении картин',
      details: error.message,
      code: error.code
    });
  }
};

const getPictureById = async (req, res) => {
  try {
    const { id } = req.params;

    const picture = await prisma.picture.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true,
            status: true
          }
        },
        pictureSize: true,
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
    });

    if (!picture) {
      return res.status(404).json({
        error: 'Картина не найдена'
      });
    }

    // Рассчитываем прибыль
    const profit = await costCalculationService.calculatePictureProfit(id);

    res.json({ 
      picture: {
        ...picture,
        profit
      }
    });
  } catch (error) {
    console.error('Get picture by id error:', error);
    res.status(500).json({
      error: 'Ошибка при получении картины'
    });
  }
};

const createPicture = async (req, res) => {
  try {
    const {
      orderId,
      pictureSizeId,
      name,
      description,
      type,
      status,
      price,
      workHours,
      notes,
      materials,
      imageUrl
    } = req.body;

    const picture = await prisma.picture.create({
      data: {
        ...(orderId && { orderId }),
        pictureSizeId,
        name,
        description,
        type,
        status: status || 'IN_PROGRESS',
        price,
        workHours,
        notes,
        imageUrl
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true
          }
        },
        pictureSize: true
      }
    });

    // Добавляем материалы к картине
    if (materials && materials.length > 0) {
      for (const material of materials) {
        await prisma.pictureMaterial.create({
          data: {
            pictureId: picture.id,
            materialId: material.materialId,
            quantity: material.quantity
          }
        });
      }
    }

    // Рассчитываем себестоимость
    const costPrice = await costCalculationService.updatePictureCost(picture.id);

    // Получаем обновленную картину
    const updatedPicture = await prisma.picture.findUnique({
      where: { id: picture.id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true
          }
        },
        pictureSize: true,
        materials: {
          include: {
            material: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Картина успешно создана',
      picture: updatedPicture
    });
  } catch (error) {
    console.error('Create picture error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Ошибка при создании картины',
      details: error.message
    });
  }
};

const updatePicture = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      status,
      price,
      workHours,
      notes
    } = req.body;

    const picture = await prisma.picture.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(price !== undefined && { price }),
        ...(workHours !== undefined && { workHours }),
        ...(notes !== undefined && { notes })
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true
          }
        },
        pictureSize: true,
        materials: {
          include: {
            material: true
          }
        }
      }
    });

    // Пересчитываем себестоимость при изменении цены или материалов
    if (price !== undefined) {
      await costCalculationService.updatePictureCost(id);
    }

    res.json({
      message: 'Картина успешно обновлена',
      picture
    });
  } catch (error) {
    console.error('Update picture error:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении картины'
    });
  }
};

const deletePicture = async (req, res) => {
  try {
    const { id } = req.params;

    // Возвращаем материалы на склад
    await stockService.returnMaterialsToStock(id);

    await prisma.picture.delete({
      where: { id }
    });

    res.json({
      message: 'Картина успешно удалена'
    });
  } catch (error) {
    console.error('Delete picture error:', error);
    res.status(500).json({
      error: 'Ошибка при удалении картины'
    });
  }
};

const addMaterialsToPicture = async (req, res) => {
  try {
    const { id } = req.params;
    const { materials } = req.body;

    // Проверяем доступность материалов на складе
    const availability = await stockService.checkStockAvailability(materials);
    
    if (!availability.sufficient) {
      return res.status(400).json({
        error: 'Недостаточно материалов на складе',
        missing: availability.missing
      });
    }

    // Добавляем материалы к картине
    for (const material of materials) {
      await prisma.pictureMaterial.upsert({
        where: {
          pictureId_materialId: {
            pictureId: id,
            materialId: material.materialId
          }
        },
        update: {
          quantity: material.quantity
        },
        create: {
          pictureId: id,
          materialId: material.materialId,
          quantity: material.quantity
        }
      });
    }

    // Резервируем материалы на складе
    await stockService.reserveMaterialsForPicture(id);

    // Пересчитываем себестоимость
    const costPrice = await costCalculationService.updatePictureCost(id);

    res.json({
      message: 'Материалы добавлены к картине',
      costPrice
    });
  } catch (error) {
    console.error('Add materials to picture error:', error);
    res.status(500).json({
      error: 'Ошибка при добавлении материалов к картине'
    });
  }
};

const updatePictureStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const picture = await prisma.picture.update({
      where: { id },
      data: { status },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true
          }
        },
        pictureSize: true
      }
    });

    // Если картина отменена, возвращаем материалы на склад
    if (status === 'CANCELLED') {
      await stockService.returnMaterialsToStock(id);
    }

    res.json({
      message: 'Статус картины обновлен',
      picture
    });
  } catch (error) {
    console.error('Update picture status error:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении статуса картины'
    });
  }
};

const calculatePictureCost = async (req, res) => {
  try {
    const { id } = req.params;

    const costPrice = await costCalculationService.calculatePictureCost(id);
    const profit = await costCalculationService.calculatePictureProfit(id);

    res.json({
      costPrice,
      profit
    });
  } catch (error) {
    console.error('Calculate picture cost error:', error);
    res.status(500).json({
      error: 'Ошибка при расчете себестоимости картины'
    });
  }
};

module.exports = {
  getAllPictures,
  getPictureById,
  createPicture,
  updatePicture,
  deletePicture,
  addMaterialsToPicture,
  updatePictureStatus,
  calculatePictureCost
};
