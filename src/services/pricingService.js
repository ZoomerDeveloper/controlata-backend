const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const costCalculationService = require('./costCalculationService');

const prisma = new PrismaClient();

class PricingService {
  /**
   * Рассчитывает рекомендуемую цену картины на основе себестоимости и наценки
   * @param {string} pictureId - ID картины
   * @param {Object} options - Опции ценообразования
   * @returns {Promise<Object>} - Рекомендуемая цена и детали расчета
   */
  async calculateRecommendedPrice(pictureId, options = {}) {
    try {
      const {
        markupPercentage = 200, // 200% наценка по умолчанию
        minPrice = 50, // Минимальная цена
        maxPrice = 1000, // Максимальная цена
        complexityMultiplier = 1.0, // Множитель сложности
        sizeMultiplier = 1.0, // Множитель размера
        urgencyMultiplier = 1.0 // Множитель срочности
      } = options;

      // Получаем картину с материалами
      const picture = await prisma.picture.findUnique({
        where: { id: pictureId },
        include: {
          pictureSize: true,
          materials: {
            include: {
              material: true
            }
          }
        }
      });

      if (!picture) {
        throw new Error('Картина не найдена');
      }

      // Рассчитываем себестоимость
      const costPrice = await costCalculationService.calculatePictureCost(pictureId);
      
      // Базовый расчет цены
      let recommendedPrice = costPrice * (1 + markupPercentage / 100);
      
      // Применяем множители
      recommendedPrice *= complexityMultiplier;
      recommendedPrice *= sizeMultiplier;
      recommendedPrice *= urgencyMultiplier;
      
      // Применяем ограничения
      recommendedPrice = Math.max(recommendedPrice, minPrice);
      recommendedPrice = Math.min(recommendedPrice, maxPrice);
      
      // Округляем до ближайшего евро
      recommendedPrice = Math.round(recommendedPrice);

      const calculation = {
        costPrice,
        markupPercentage,
        basePrice: costPrice * (1 + markupPercentage / 100),
        complexityMultiplier,
        sizeMultiplier,
        urgencyMultiplier,
        finalPrice: recommendedPrice,
        profit: recommendedPrice - costPrice,
        profitMargin: ((recommendedPrice - costPrice) / recommendedPrice) * 100
      };

      logger.info('Calculated recommended price', {
        pictureId,
        calculation
      });

      return {
        recommendedPrice,
        calculation,
        picture: {
          id: picture.id,
          name: picture.name,
          type: picture.type,
          size: picture.pictureSize.name
        }
      };
    } catch (error) {
      logger.error('Error calculating recommended price', {
        pictureId,
        options,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Рассчитывает цену на основе размера картины
   * @param {string} pictureSizeId - ID размера картины
   * @param {Object} options - Опции ценообразования
   * @returns {Promise<Object>} - Рекомендуемая цена
   */
  async calculatePriceBySize(pictureSizeId, options = {}) {
    try {
      const {
        basePricePerCm2 = 0.5, // Базовая цена за см²
        minPrice = 50,
        maxPrice = 1000,
        typeMultiplier = 1.0 // Множитель для типа картины
      } = options;

      const pictureSize = await prisma.pictureSize.findUnique({
        where: { id: pictureSizeId }
      });

      if (!pictureSize) {
        throw new Error('Размер картины не найден');
      }

      // Рассчитываем площадь в см²
      const area = pictureSize.width * pictureSize.height;
      
      // Базовая цена
      let price = area * basePricePerCm2;
      
      // Применяем множитель типа
      price *= typeMultiplier;
      
      // Применяем ограничения
      price = Math.max(price, minPrice);
      price = Math.min(price, maxPrice);
      
      // Округляем
      price = Math.round(price);

      return {
        recommendedPrice: price,
        calculation: {
          area,
          basePricePerCm2,
          typeMultiplier,
          finalPrice: price
        },
        pictureSize: {
          id: pictureSize.id,
          name: pictureSize.name,
          width: pictureSize.width,
          height: pictureSize.height
        }
      };
    } catch (error) {
      logger.error('Error calculating price by size', {
        pictureSizeId,
        options,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Обновляет цены всех картин на основе новых настроек ценообразования
   * @param {Object} pricingSettings - Настройки ценообразования
   * @returns {Promise<Object>} - Результат обновления
   */
  async updateAllPicturePrices(pricingSettings = {}) {
    try {
      logger.info('Starting bulk price update', { pricingSettings });

      const pictures = await prisma.picture.findMany({
        where: { isActive: true },
        include: {
          pictureSize: true
        }
      });

      const results = {
        total: pictures.length,
        updated: 0,
        errors: 0,
        details: []
      };

      for (const picture of pictures) {
        try {
          const priceData = await this.calculateRecommendedPrice(picture.id, pricingSettings);
          
          await prisma.picture.update({
            where: { id: picture.id },
            data: {
              price: priceData.recommendedPrice,
              costPrice: priceData.calculation.costPrice
            }
          });

          results.updated++;
          results.details.push({
            pictureId: picture.id,
            pictureName: picture.name,
            oldPrice: picture.price,
            newPrice: priceData.recommendedPrice,
            costPrice: priceData.calculation.costPrice
          });

          logger.info('Updated picture price', {
            pictureId: picture.id,
            oldPrice: picture.price,
            newPrice: priceData.recommendedPrice
          });
        } catch (error) {
          results.errors++;
          results.details.push({
            pictureId: picture.id,
            pictureName: picture.name,
            error: error.message
          });

          logger.error('Error updating picture price', {
            pictureId: picture.id,
            error: error.message
          });
        }
      }

      logger.info('Bulk price update completed', results);
      return results;
    } catch (error) {
      logger.error('Error in bulk price update', {
        pricingSettings,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Получает статистику ценообразования
   * @returns {Promise<Object>} - Статистика цен
   */
  async getPricingStats() {
    try {
      const pictures = await prisma.picture.findMany({
        where: { isActive: true },
        select: {
          price: true,
          costPrice: true,
          type: true,
          pictureSize: {
            select: {
              name: true,
              width: true,
              height: true
            }
          }
        }
      });

      const stats = {
        total: pictures.length,
        averagePrice: 0,
        averageCost: 0,
        averageMargin: 0,
        byType: {},
        bySize: {},
        priceRanges: {
          under50: 0,
          '50-100': 0,
          '100-200': 0,
          '200-500': 0,
          '500-1000': 0,
          over1000: 0
        }
      };

      if (pictures.length > 0) {
        let totalPrice = 0;
        let totalCost = 0;

        pictures.forEach(picture => {
          totalPrice += picture.price || 0;
          totalCost += picture.costPrice || 0;

          // Группировка по типу
          if (!stats.byType[picture.type]) {
            stats.byType[picture.type] = { count: 0, totalPrice: 0, totalCost: 0 };
          }
          stats.byType[picture.type].count++;
          stats.byType[picture.type].totalPrice += picture.price || 0;
          stats.byType[picture.type].totalCost += picture.costPrice || 0;

          // Группировка по размеру
          const sizeName = picture.pictureSize.name;
          if (!stats.bySize[sizeName]) {
            stats.bySize[sizeName] = { count: 0, totalPrice: 0, totalCost: 0 };
          }
          stats.bySize[sizeName].count++;
          stats.bySize[sizeName].totalPrice += picture.price || 0;
          stats.bySize[sizeName].totalCost += picture.costPrice || 0;

          // Группировка по ценовым диапазонам
          const price = picture.price || 0;
          if (price < 50) stats.priceRanges.under50++;
          else if (price <= 100) stats.priceRanges['50-100']++;
          else if (price <= 200) stats.priceRanges['100-200']++;
          else if (price <= 500) stats.priceRanges['200-500']++;
          else if (price <= 1000) stats.priceRanges['500-1000']++;
          else stats.priceRanges.over1000++;
        });

        stats.averagePrice = Math.round(totalPrice / pictures.length);
        stats.averageCost = Math.round(totalCost / pictures.length);
        stats.averageMargin = stats.averagePrice > 0 ? 
          Math.round(((stats.averagePrice - stats.averageCost) / stats.averagePrice) * 100) : 0;

        // Рассчитываем средние значения для групп
        Object.keys(stats.byType).forEach(type => {
          const group = stats.byType[type];
          group.averagePrice = Math.round(group.totalPrice / group.count);
          group.averageCost = Math.round(group.totalCost / group.count);
          group.averageMargin = group.averagePrice > 0 ? 
            Math.round(((group.averagePrice - group.averageCost) / group.averagePrice) * 100) : 0;
        });

        Object.keys(stats.bySize).forEach(size => {
          const group = stats.bySize[size];
          group.averagePrice = Math.round(group.totalPrice / group.count);
          group.averageCost = Math.round(group.totalCost / group.count);
          group.averageMargin = group.averagePrice > 0 ? 
            Math.round(((group.averagePrice - group.averageCost) / group.averagePrice) * 100) : 0;
        });
      }

      return stats;
    } catch (error) {
      logger.error('Error getting pricing stats', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Получает рекомендуемые настройки ценообразования на основе исторических данных
   * @returns {Promise<Object>} - Рекомендуемые настройки
   */
  async getRecommendedPricingSettings() {
    try {
      const stats = await this.getPricingStats();
      
      // Анализируем текущие наценки
      const currentMargin = stats.averageMargin;
      
      // Рекомендуем настройки на основе анализа
      const recommendations = {
        markupPercentage: currentMargin < 150 ? 200 : currentMargin < 250 ? 250 : 300,
        basePricePerCm2: 0.5,
        minPrice: 50,
        maxPrice: 1000,
        complexityMultiplier: 1.0,
        sizeMultiplier: 1.0,
        urgencyMultiplier: 1.0,
        reasoning: {
          currentMargin,
          recommendation: currentMargin < 150 ? 
            'Увеличить наценку для улучшения прибыльности' :
            currentMargin < 250 ?
            'Текущая наценка оптимальна' :
            'Рассмотреть снижение наценки для конкурентоспособности'
        }
      };

      return recommendations;
    } catch (error) {
      logger.error('Error getting recommended pricing settings', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = new PricingService();
