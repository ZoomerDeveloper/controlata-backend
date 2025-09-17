const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CostCalculationService {
  /**
   * Рассчитывает себестоимость картины
   * @param {string} pictureId - ID картины
   * @returns {Promise<number>} - Себестоимость в евро
   */
  async calculatePictureCost(pictureId) {
    try {
      const picture = await prisma.picture.findUnique({
        where: { id: pictureId },
        include: {
          pictureSize: true,
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

      let totalCost = 0;

      // Рассчитываем стоимость материалов
      for (const pictureMaterial of picture.materials) {
        const material = pictureMaterial.material;
        const stock = material.stocks[0]; // Предполагаем один складской остаток

        if (!stock) {
          throw new Error(`Нет данных о стоимости материала: ${material.name}`);
        }

        // Получаем среднюю стоимость материала из последних закупок
        const averagePrice = await this.getAverageMaterialPrice(material.id);
        
        const materialCost = pictureMaterial.quantity * averagePrice;
        totalCost += materialCost;
      }

      // Добавляем стоимость рабочего времени (если указано)
      if (picture.workHours && picture.workHours > 0) {
        const hourlyRate = await this.getHourlyRate();
        totalCost += picture.workHours * hourlyRate;
      }

      return Math.round(totalCost * 100) / 100; // Округляем до 2 знаков
    } catch (error) {
      console.error('Error calculating picture cost:', error);
      throw error;
    }
  }

  /**
   * Получает среднюю стоимость материала из последних закупок
   * @param {string} materialId - ID материала
   * @returns {Promise<number>} - Средняя цена за единицу
   */
  async getAverageMaterialPrice(materialId) {
    const purchases = await prisma.materialPurchase.findMany({
      where: { materialId },
      orderBy: { purchaseDate: 'desc' },
      take: 10 // Берем последние 10 закупок
    });

    if (purchases.length === 0) {
      return 0;
    }

    const totalCost = purchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0);
    const totalQuantity = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);

    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }

  /**
   * Получает почасовую ставку для расчета стоимости работы
   * @returns {Promise<number>} - Почасовая ставка в евро
   */
  async getHourlyRate() {
    // Можно сделать настраиваемой через настройки системы
    // Пока возвращаем фиксированное значение
    return 15; // 15 евро в час
  }

  /**
   * Обновляет себестоимость картины
   * @param {string} pictureId - ID картины
   */
  async updatePictureCost(pictureId) {
    try {
      const costPrice = await this.calculatePictureCost(pictureId);
      
      await prisma.picture.update({
        where: { id: pictureId },
        data: { costPrice }
      });

      return costPrice;
    } catch (error) {
      console.error('Error updating picture cost:', error);
      throw error;
    }
  }

  /**
   * Рассчитывает прибыль по картине
   * @param {string} pictureId - ID картины
   * @returns {Promise<{profit: number, margin: number}>}
   */
  async calculatePictureProfit(pictureId) {
    try {
      const picture = await prisma.picture.findUnique({
        where: { id: pictureId },
        select: {
          price: true,
          costPrice: true
        }
      });

      if (!picture) {
        throw new Error('Картина не найдена');
      }

      const profit = picture.price - (picture.costPrice || 0);
      const margin = picture.price > 0 ? (profit / picture.price) * 100 : 0;

      return {
        profit: Math.round(profit * 100) / 100,
        margin: Math.round(margin * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating picture profit:', error);
      throw error;
    }
  }
}

module.exports = new CostCalculationService();
