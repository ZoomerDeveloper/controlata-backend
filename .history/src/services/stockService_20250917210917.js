const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class StockService {
  /**
   * Обновляет остатки на складе после закупки
   * @param {string} materialId - ID материала
   * @param {number} quantity - Количество
   */
  async updateStockAfterPurchase(materialId, quantity) {
    try {
      const existingStock = await prisma.stock.findUnique({
        where: { materialId }
      });

      if (existingStock) {
        await prisma.stock.update({
          where: { materialId },
          data: {
            quantity: existingStock.quantity + quantity,
            lastUpdated: new Date()
          }
        });
      } else {
        await prisma.stock.create({
          data: {
            materialId,
            quantity,
            lastUpdated: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error updating stock after purchase:', error);
      throw error;
    }
  }

  /**
   * Резервирует материалы для картины
   * @param {string} pictureId - ID картины
   */
  async reserveMaterialsForPicture(pictureId) {
    try {
      const picture = await prisma.picture.findUnique({
        where: { id: pictureId },
        include: {
          materials: {
            include: {
              material: {
                include: {
                  stocks: true
                }
              }
            }
          }
        }
      });

      if (!picture) {
        throw new Error('Картина не найдена');
      }

      for (const pictureMaterial of picture.materials) {
        const material = pictureMaterial.material;
        const stock = material.stocks[0];

        if (!stock) {
          throw new Error(`Нет данных о складских остатках для материала: ${material.name}`);
        }

        if (stock.quantity < pictureMaterial.quantity) {
          throw new Error(`Недостаточно материала на складе: ${material.name}. Доступно: ${stock.quantity}, требуется: ${pictureMaterial.quantity}`);
        }

        // Резервируем материалы (уменьшаем остаток)
        await prisma.stock.update({
          where: { materialId: material.id },
          data: {
            quantity: stock.quantity - pictureMaterial.quantity,
            lastUpdated: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error reserving materials for picture:', error);
      throw error;
    }
  }

  /**
   * Возвращает материалы на склад (при отмене заказа)
   * @param {string} pictureId - ID картины
   */
  async returnMaterialsToStock(pictureId) {
    try {
      const picture = await prisma.picture.findUnique({
        where: { id: pictureId },
        include: {
          materials: {
            include: {
              material: {
                include: {
                  stocks: true
                }
              }
            }
          }
        }
      });

      if (!picture) {
        throw new Error('Картина не найдена');
      }

      for (const pictureMaterial of picture.materials) {
        const material = pictureMaterial.material;
        const stock = material.stocks[0];

        if (stock) {
          await prisma.stock.update({
            where: { materialId: material.id },
            data: {
              quantity: stock.quantity + pictureMaterial.quantity,
              lastUpdated: new Date()
            }
          });
        }
      }
    } catch (error) {
      console.error('Error returning materials to stock:', error);
      throw error;
    }
  }

  /**
   * Проверяет достаточность материалов на складе
   * @param {Array} materials - Массив материалов с количеством
   * @returns {Promise<{sufficient: boolean, missing: Array}>}
   */
  async checkStockAvailability(materials) {
    try {
      const missing = [];

      for (const material of materials) {
        const stock = await prisma.stock.findUnique({
          where: { materialId: material.materialId }
        });

        if (!stock || stock.quantity < material.quantity) {
          missing.push({
            materialId: material.materialId,
            required: material.quantity,
            available: stock ? stock.quantity : 0
          });
        }
      }

      return {
        sufficient: missing.length === 0,
        missing
      };
    } catch (error) {
      console.error('Error checking stock availability:', error);
      throw error;
    }
  }

  /**
   * Получает список материалов с низким остатком
   * @returns {Promise<Array>}
   */
  async getLowStockMaterials() {
    try {
      const lowStockMaterials = await prisma.stock.findMany({
        where: {
          AND: [
            { minLevel: { not: null } },
            { quantity: { lte: prisma.stock.fields.minLevel } }
          ]
        },
        include: {
          material: true
        }
      });

      return lowStockMaterials;
    } catch (error) {
      console.error('Error getting low stock materials:', error);
      throw error;
    }
  }

  /**
   * Обновляет минимальный уровень остатка для материала
   * @param {string} materialId - ID материала
   * @param {number} minLevel - Минимальный уровень
   */
  async updateMinLevel(materialId, minLevel) {
    try {
      await prisma.stock.update({
        where: { materialId },
        data: { minLevel }
      });
    } catch (error) {
      console.error('Error updating min level:', error);
      throw error;
    }
  }
}

module.exports = new StockService();
