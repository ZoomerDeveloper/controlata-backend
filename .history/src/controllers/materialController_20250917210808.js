const { PrismaClient } = require('@prisma/client');
const stockService = require('../services/stockService');

const prisma = new PrismaClient();

const getAllMaterials = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', category, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        where,
        include: {
          pictureSize: {
            select: {
              id: true,
              name: true,
              width: true,
              height: true
            }
          },
          stocks: true,
          _count: {
            select: {
              purchases: true,
              pictureMaterials: true
            }
          }
        }
      }),
      prisma.material.count({ where })
    ]);

    res.json({
      materials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all materials error:', error);
    res.status(500).json({
      error: 'Ошибка при получении материалов'
    });
  }
};

const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        pictureSize: true,
        stocks: true,
        purchases: {
          orderBy: { purchaseDate: 'desc' },
          take: 10
        },
        pictureMaterials: {
          include: {
            picture: {
              select: {
                id: true,
                name: true,
                type: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!material) {
      return res.status(404).json({
        error: 'Материал не найден'
      });
    }

    res.json({ material });
  } catch (error) {
    console.error('Get material by id error:', error);
    res.status(500).json({
      error: 'Ошибка при получении материала'
    });
  }
};

const createMaterial = async (req, res) => {
  try {
    const { name, description, unit, category, pictureSizeId } = req.body;

    const material = await prisma.material.create({
      data: {
        name,
        description,
        unit,
        category,
        pictureSizeId: pictureSizeId || null
      },
      include: {
        pictureSize: true
      }
    });

    res.status(201).json({
      message: 'Материал успешно создан',
      material
    });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({
      error: 'Ошибка при создании материала'
    });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, unit, category, pictureSizeId, isActive } = req.body;

    const material = await prisma.material.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(unit && { unit }),
        ...(category && { category }),
        ...(pictureSizeId !== undefined && { pictureSizeId: pictureSizeId || null }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        pictureSize: true,
        stocks: true
      }
    });

    res.json({
      message: 'Материал успешно обновлен',
      material
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении материала'
    });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, используется ли материал в картинах
    const pictureMaterialsCount = await prisma.pictureMaterial.count({
      where: { materialId: id }
    });

    if (pictureMaterialsCount > 0) {
      return res.status(400).json({
        error: 'Нельзя удалить материал, который используется в картинах'
      });
    }

    await prisma.material.delete({
      where: { id }
    });

    res.json({
      message: 'Материал успешно удален'
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      error: 'Ошибка при удалении материала'
    });
  }
};

const createMaterialPurchase = async (req, res) => {
  try {
    const { materialId, quantity, unitPrice, supplier, notes } = req.body;
    const totalPrice = quantity * unitPrice;

    // Создаем закупку
    const purchase = await prisma.materialPurchase.create({
      data: {
        materialId,
        quantity,
        unitPrice,
        totalPrice,
        supplier,
        notes
      },
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
    });

    // Обновляем складские остатки
    await stockService.updateStockAfterPurchase(materialId, quantity);

    res.status(201).json({
      message: 'Закупка материала успешно создана',
      purchase
    });
  } catch (error) {
    console.error('Create material purchase error:', error);
    res.status(500).json({
      error: 'Ошибка при создании закупки материала'
    });
  }
};

const getMaterialPurchases = async (req, res) => {
  try {
    const { materialId, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = materialId ? { materialId } : {};

    const [purchases, total] = await Promise.all([
      prisma.materialPurchase.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { purchaseDate: 'desc' },
        where,
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
      }),
      prisma.materialPurchase.count({ where })
    ]);

    res.json({
      purchases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get material purchases error:', error);
    res.status(500).json({
      error: 'Ошибка при получении закупок материалов'
    });
  }
};

const updateStockLevel = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { minLevel } = req.body;

    await stockService.updateMinLevel(materialId, minLevel);

    res.json({
      message: 'Минимальный уровень остатка обновлен'
    });
  } catch (error) {
    console.error('Update stock level error:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении уровня остатка'
    });
  }
};

const getLowStockMaterials = async (req, res) => {
  try {
    const lowStockMaterials = await stockService.getLowStockMaterials();

    res.json({
      lowStockMaterials,
      count: lowStockMaterials.length
    });
  } catch (error) {
    console.error('Get low stock materials error:', error);
    res.status(500).json({
      error: 'Ошибка при получении материалов с низким остатком'
    });
  }
};

module.exports = {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  createMaterialPurchase,
  getMaterialPurchases,
  updateStockLevel,
  getLowStockMaterials
};
