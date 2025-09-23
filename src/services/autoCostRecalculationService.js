const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const costCalculationService = require('./costCalculationService');
const pricingService = require('./pricingService');

const prisma = new PrismaClient();

class AutoCostRecalculationService {
  /**
   * Пересчитывает себестоимость всех картин при изменении цен материалов
   * @param {string} materialId - ID материала, цена которого изменилась
   * @param {Object} options - Опции пересчета
   * @returns {Promise<Object>} - Результат пересчета
   */
  async recalculateAllPictureCosts(materialId, options = {}) {
    try {
      logger.info('Starting automatic cost recalculation', { materialId, options });

      // Находим все картины, использующие этот материал
      const picturesWithMaterial = await prisma.picture.findMany({
        where: {
          materials: {
            some: {
              materialId: materialId
            }
          },
          isActive: true
        },
        include: {
          materials: {
            include: {
              material: true
            }
          }
        }
      });

      const results = {
        materialId,
        totalPictures: picturesWithMaterial.length,
        updated: 0,
        errors: 0,
        details: []
      };

      for (const picture of picturesWithMaterial) {
        try {
          // Пересчитываем себестоимость
          const newCostPrice = await costCalculationService.calculatePictureCost(picture.id);
          
          // Обновляем себестоимость в базе данных
          await prisma.picture.update({
            where: { id: picture.id },
            data: {
              costPrice: newCostPrice
            }
          });

          // Если включено автоматическое обновление цен
          if (options.updatePrices) {
            const priceData = await pricingService.calculateRecommendedPrice(picture.id, options.pricingSettings);
            
            await prisma.picture.update({
              where: { id: picture.id },
              data: {
                price: priceData.recommendedPrice
              }
            });

            results.details.push({
              pictureId: picture.id,
              pictureName: picture.name,
              oldCostPrice: picture.costPrice,
              newCostPrice,
              oldPrice: picture.price,
              newPrice: priceData.recommendedPrice,
              priceUpdated: true
            });
          } else {
            results.details.push({
              pictureId: picture.id,
              pictureName: picture.name,
              oldCostPrice: picture.costPrice,
              newCostPrice,
              priceUpdated: false
            });
          }

          results.updated++;

          logger.info('Updated picture cost', {
            pictureId: picture.id,
            oldCostPrice: picture.costPrice,
            newCostPrice
          });
        } catch (error) {
          results.errors++;
          results.details.push({
            pictureId: picture.id,
            pictureName: picture.name,
            error: error.message
          });

          logger.error('Error updating picture cost', {
            pictureId: picture.id,
            error: error.message
          });
        }
      }

      logger.info('Automatic cost recalculation completed', results);
      return results;
    } catch (error) {
      logger.error('Error in automatic cost recalculation', {
        materialId,
        options,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Пересчитывает себестоимость всех картин в системе
   * @param {Object} options - Опции пересчета
   * @returns {Promise<Object>} - Результат пересчета
   */
  async recalculateAllCosts(options = {}) {
    try {
      logger.info('Starting full cost recalculation', { options });

      const pictures = await prisma.picture.findMany({
        where: { isActive: true },
        include: {
          materials: {
            include: {
              material: true
            }
          }
        }
      });

      const results = {
        totalPictures: pictures.length,
        updated: 0,
        errors: 0,
        details: []
      };

      for (const picture of pictures) {
        try {
          const newCostPrice = await costCalculationService.calculatePictureCost(picture.id);
          
          await prisma.picture.update({
            where: { id: picture.id },
            data: {
              costPrice: newCostPrice
            }
          });

          if (options.updatePrices) {
            const priceData = await pricingService.calculateRecommendedPrice(picture.id, options.pricingSettings);
            
            await prisma.picture.update({
              where: { id: picture.id },
              data: {
                price: priceData.recommendedPrice
              }
            });

            results.details.push({
              pictureId: picture.id,
              pictureName: picture.name,
              oldCostPrice: picture.costPrice,
              newCostPrice,
              oldPrice: picture.price,
              newPrice: priceData.recommendedPrice,
              priceUpdated: true
            });
          } else {
            results.details.push({
              pictureId: picture.id,
              pictureName: picture.name,
              oldCostPrice: picture.costPrice,
              newCostPrice,
              priceUpdated: false
            });
          }

          results.updated++;
        } catch (error) {
          results.errors++;
          results.details.push({
            pictureId: picture.id,
            pictureName: picture.name,
            error: error.message
          });
        }
      }

      logger.info('Full cost recalculation completed', results);
      return results;
    } catch (error) {
      logger.error('Error in full cost recalculation', {
        options,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Пересчитывает себестоимость картин определенного типа
   * @param {string} pictureType - Тип картины (READY_MADE, CUSTOM_PHOTO)
   * @param {Object} options - Опции пересчета
   * @returns {Promise<Object>} - Результат пересчета
   */
  async recalculateCostsByType(pictureType, options = {}) {
    try {
      logger.info('Starting cost recalculation by type', { pictureType, options });

      const pictures = await prisma.picture.findMany({
        where: { 
          type: pictureType,
          isActive: true 
        },
        include: {
          materials: {
            include: {
              material: true
            }
          }
        }
      });

      const results = {
        pictureType,
        totalPictures: pictures.length,
        updated: 0,
        errors: 0,
        details: []
      };

      for (const picture of pictures) {
        try {
          const newCostPrice = await costCalculationService.calculatePictureCost(picture.id);
          
          await prisma.picture.update({
            where: { id: picture.id },
            data: {
              costPrice: newCostPrice
            }
          });

          if (options.updatePrices) {
            const priceData = await pricingService.calculateRecommendedPrice(picture.id, options.pricingSettings);
            
            await prisma.picture.update({
              where: { id: picture.id },
              data: {
                price: priceData.recommendedPrice
              }
            });

            results.details.push({
              pictureId: picture.id,
              pictureName: picture.name,
              oldCostPrice: picture.costPrice,
              newCostPrice,
              oldPrice: picture.price,
              newPrice: priceData.recommendedPrice,
              priceUpdated: true
            });
          } else {
            results.details.push({
              pictureId: picture.id,
              pictureName: picture.name,
              oldCostPrice: picture.costPrice,
              newCostPrice,
              priceUpdated: false
            });
          }

          results.updated++;
        } catch (error) {
          results.errors++;
          results.details.push({
            pictureId: picture.id,
            pictureName: picture.name,
            error: error.message
          });
        }
      }

      logger.info('Cost recalculation by type completed', results);
      return results;
    } catch (error) {
      logger.error('Error in cost recalculation by type', {
        pictureType,
        options,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Получает статистику пересчета себестоимости
   * @returns {Promise<Object>} - Статистика
   */
  async getRecalculationStats() {
    try {
      const pictures = await prisma.picture.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          costPrice: true,
          price: true,
          updatedAt: true
        }
      });

      const stats = {
        total: pictures.length,
        withCostPrice: pictures.filter(p => p.costPrice && p.costPrice > 0).length,
        withoutCostPrice: pictures.filter(p => !p.costPrice || p.costPrice <= 0).length,
        averageCostPrice: 0,
        averagePrice: 0,
        averageMargin: 0,
        byType: {
          READY_MADE: { count: 0, averageCost: 0, averagePrice: 0 },
          CUSTOM_PHOTO: { count: 0, averageCost: 0, averagePrice: 0 }
        }
      };

      if (pictures.length > 0) {
        let totalCost = 0;
        let totalPrice = 0;

        pictures.forEach(picture => {
          if (picture.costPrice) totalCost += picture.costPrice;
          if (picture.price) totalPrice += picture.price;

          // Группировка по типу
          if (stats.byType[picture.type]) {
            stats.byType[picture.type].count++;
            if (picture.costPrice) stats.byType[picture.type].averageCost += picture.costPrice;
            if (picture.price) stats.byType[picture.type].averagePrice += picture.price;
          }
        });

        stats.averageCostPrice = Math.round(totalCost / pictures.length);
        stats.averagePrice = Math.round(totalPrice / pictures.length);
        stats.averageMargin = stats.averagePrice > 0 ? 
          Math.round(((stats.averagePrice - stats.averageCostPrice) / stats.averagePrice) * 100) : 0;

        // Рассчитываем средние значения для типов
        Object.keys(stats.byType).forEach(type => {
          const group = stats.byType[type];
          if (group.count > 0) {
            group.averageCost = Math.round(group.averageCost / group.count);
            group.averagePrice = Math.round(group.averagePrice / group.count);
          }
        });
      }

      return stats;
    } catch (error) {
      logger.error('Error getting recalculation stats', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = new AutoCostRecalculationService();
