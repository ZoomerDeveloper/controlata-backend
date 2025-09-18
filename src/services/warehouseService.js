const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class WarehouseService {
  // Получить все материалы с остатками
  async getMaterialsWithStock() {
    try {
      const materials = await prisma.material.findMany({
        where: { isActive: true },
        include: {
          stocks: true,
          pictureSize: true,
          _count: {
            select: {
              movements: true
            }
          }
        }
      });

      return materials.map(material => ({
        ...material,
        currentStock: material.stocks[0]?.quantity || 0,
        minLevel: material.stocks[0]?.minLevel || 0,
        isLowStock: (material.stocks[0]?.quantity || 0) <= (material.stocks[0]?.minLevel || 0)
      }));
    } catch (error) {
      logger.error('Error getting materials with stock', { error: error.message });
      throw error;
    }
  }

  // Получить материалы с низким остатком
  async getLowStockMaterials() {
    try {
      const materials = await prisma.material.findMany({
        where: { 
          isActive: true,
          stocks: {
            some: {
              quantity: {
                lte: prisma.stock.fields.minLevel
              }
            }
          }
        },
        include: {
          stocks: true,
          pictureSize: true
        }
      });

      return materials.map(material => ({
        ...material,
        currentStock: material.stocks[0]?.quantity || 0,
        minLevel: material.stocks[0]?.minLevel || 0
      }));
    } catch (error) {
      logger.error('Error getting low stock materials', { error: error.message });
      throw error;
    }
  }

  // Добавить материал на склад (поступление)
  async addMaterialToStock(materialId, quantity, reason, referenceId = null, referenceType = null, notes = null) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Найти или создать запись остатка
        let stock = await tx.stock.findUnique({
          where: { materialId }
        });

        if (!stock) {
          stock = await tx.stock.create({
            data: {
              materialId,
              quantity: 0
            }
          });
        }

        // Обновить остаток
        const newQuantity = stock.quantity + quantity;
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantity: newQuantity,
            lastUpdated: new Date()
          }
        });

        // Создать запись движения
        const movement = await tx.materialMovement.create({
          data: {
            materialId,
            stockId: stock.id,
            type: 'IN',
            quantity: Math.abs(quantity),
            reason,
            referenceId,
            referenceType,
            notes
          }
        });

        logger.info('Material added to stock', {
          materialId,
          quantity,
          newQuantity,
          movementId: movement.id
        });

        return { stock, movement, newQuantity };
      });
    } catch (error) {
      logger.error('Error adding material to stock', { error: error.message });
      throw error;
    }
  }

  // Списать материал со склада
  async removeMaterialFromStock(materialId, quantity, reason, referenceId = null, referenceType = null, notes = null) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Найти запись остатка
        const stock = await tx.stock.findUnique({
          where: { materialId }
        });

        if (!stock) {
          throw new Error('Материал не найден на складе');
        }

        // Проверить достаточность остатка
        const newQuantity = stock.quantity - quantity;
        const isNegative = newQuantity < 0;

        // Обновить остаток (разрешаем уйти в минус)
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantity: newQuantity,
            lastUpdated: new Date()
          }
        });

        // Создать запись движения
        const movement = await tx.materialMovement.create({
          data: {
            materialId,
            stockId: stock.id,
            type: 'OUT',
            quantity: Math.abs(quantity),
            reason,
            referenceId,
            referenceType,
            notes
          }
        });

        logger.info('Material removed from stock', {
          materialId,
          quantity,
          newQuantity,
          isNegative,
          movementId: movement.id
        });

        return { stock, movement, newQuantity, isNegative };
      });
    } catch (error) {
      logger.error('Error removing material from stock', { error: error.message });
      throw error;
    }
  }

  // Получить историю движений материала
  async getMaterialMovements(materialId, limit = 50) {
    try {
      const movements = await prisma.materialMovement.findMany({
        where: { materialId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          material: {
            select: {
              name: true,
              unit: true
            }
          }
        }
      });

      return movements;
    } catch (error) {
      logger.error('Error getting material movements', { error: error.message });
      throw error;
    }
  }

  // Получить все движения материалов
  async getAllMovements(limit = 100) {
    try {
      const movements = await prisma.materialMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          material: {
            select: {
              name: true,
              unit: true,
              category: true
            }
          }
        }
      });

      return movements;
    } catch (error) {
      logger.error('Error getting all movements', { error: error.message });
      throw error;
    }
  }

  // Корректировка остатка
  async adjustStock(materialId, newQuantity, reason, notes = null) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Найти запись остатка
        let stock = await tx.stock.findUnique({
          where: { materialId }
        });

        if (!stock) {
          stock = await tx.stock.create({
            data: {
              materialId,
              quantity: 0
            }
          });
        }

        const oldQuantity = stock.quantity;
        const difference = newQuantity - oldQuantity;

        // Обновить остаток
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantity: newQuantity,
            lastUpdated: new Date()
          }
        });

        // Создать запись движения
        const movement = await tx.materialMovement.create({
          data: {
            materialId,
            stockId: stock.id,
            type: 'ADJUSTMENT',
            quantity: Math.abs(difference),
            reason,
            notes: notes || `Корректировка с ${oldQuantity} до ${newQuantity}`
          }
        });

        logger.info('Stock adjusted', {
          materialId,
          oldQuantity,
          newQuantity,
          difference,
          movementId: movement.id
        });

        return { stock, movement, oldQuantity, newQuantity, difference };
      });
    } catch (error) {
      logger.error('Error adjusting stock', { error: error.message });
      throw error;
    }
  }

  // Получить статистику склада
  async getWarehouseStats() {
    try {
      const totalMaterials = await prisma.material.count({
        where: { isActive: true }
      });

      const lowStockCount = await prisma.material.count({
        where: { 
          isActive: true,
          stocks: {
            some: {
              quantity: {
                lte: prisma.stock.fields.minLevel
              }
            }
          }
        }
      });

      const totalStockValue = await prisma.stock.aggregate({
        _sum: {
          quantity: true
        }
      });

      const recentMovements = await prisma.materialMovement.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // последние 7 дней
          }
        }
      });

      return {
        totalMaterials,
        lowStockCount,
        totalStockValue: totalStockValue._sum.quantity || 0,
        recentMovements
      };
    } catch (error) {
      logger.error('Error getting warehouse stats', { error: error.message });
      throw error;
    }
  }
}

module.exports = new WarehouseService();
