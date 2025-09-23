const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class OrderNumberingService {
  /**
   * Генерирует уникальный номер заказа
   * Формат: ART-YYYY-MM-DD-XXX (например: ART-2024-12-18-001)
   * @returns {Promise<string>} - Уникальный номер заказа
   */
  async generateOrderNumber() {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const datePrefix = `${year}-${month}-${day}`;
      
      // Ищем последний заказ за сегодня
      const lastOrder = await prisma.order.findFirst({
        where: {
          orderNumber: {
            startsWith: `ART-${datePrefix}-`
          }
        },
        orderBy: {
          orderNumber: 'desc'
        }
      });

      let sequenceNumber = 1;
      
      if (lastOrder) {
        // Извлекаем номер из последнего заказа
        const lastNumber = lastOrder.orderNumber.split('-').pop();
        sequenceNumber = parseInt(lastNumber, 10) + 1;
      }

      const orderNumber = `ART-${datePrefix}-${String(sequenceNumber).padStart(3, '0')}`;
      
      logger.info('Generated order number', { 
        orderNumber, 
        datePrefix, 
        sequenceNumber 
      });

      return orderNumber;
    } catch (error) {
      logger.error('Error generating order number', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * Генерирует номер заказа с кастомным префиксом
   * @param {string} prefix - Префикс для номера (например: "CUSTOM", "URGENT")
   * @returns {Promise<string>} - Уникальный номер заказа
   */
  async generateCustomOrderNumber(prefix = 'ART') {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const datePrefix = `${year}-${month}-${day}`;
      
      // Ищем последний заказ с этим префиксом за сегодня
      const lastOrder = await prisma.order.findFirst({
        where: {
          orderNumber: {
            startsWith: `${prefix}-${datePrefix}-`
          }
        },
        orderBy: {
          orderNumber: 'desc'
        }
      });

      let sequenceNumber = 1;
      
      if (lastOrder) {
        const lastNumber = lastOrder.orderNumber.split('-').pop();
        sequenceNumber = parseInt(lastNumber, 10) + 1;
      }

      const orderNumber = `${prefix}-${datePrefix}-${String(sequenceNumber).padStart(3, '0')}`;
      
      logger.info('Generated custom order number', { 
        orderNumber, 
        prefix, 
        datePrefix, 
        sequenceNumber 
      });

      return orderNumber;
    } catch (error) {
      logger.error('Error generating custom order number', { 
        prefix, 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * Проверяет уникальность номера заказа
   * @param {string} orderNumber - Номер заказа для проверки
   * @returns {Promise<boolean>} - true если уникален, false если уже существует
   */
  async isOrderNumberUnique(orderNumber) {
    try {
      const existingOrder = await prisma.order.findUnique({
        where: { orderNumber }
      });

      return !existingOrder;
    } catch (error) {
      logger.error('Error checking order number uniqueness', { 
        orderNumber, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Получает статистику по номерам заказов за период
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Promise<Object>} - Статистика по заказам
   */
  async getOrderNumberingStats(startDate, endDate) {
    try {
      const orders = await prisma.order.findMany({
        where: {
          orderDate: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          orderNumber: true,
          orderDate: true,
          status: true
        },
        orderBy: {
          orderNumber: 'asc'
        }
      });

      // Группируем по префиксам
      const prefixStats = {};
      let totalOrders = 0;

      orders.forEach(order => {
        const prefix = order.orderNumber.split('-')[0];
        if (!prefixStats[prefix]) {
          prefixStats[prefix] = {
            count: 0,
            orders: []
          };
        }
        prefixStats[prefix].count++;
        prefixStats[prefix].orders.push({
          number: order.orderNumber,
          date: order.orderDate,
          status: order.status
        });
        totalOrders++;
      });

      return {
        totalOrders,
        prefixStats,
        period: {
          start: startDate,
          end: endDate
        }
      };
    } catch (error) {
      logger.error('Error getting order numbering stats', { 
        startDate, 
        endDate, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Получает следующий доступный номер для префикса
   * @param {string} prefix - Префикс
   * @returns {Promise<string>} - Следующий доступный номер
   */
  async getNextAvailableNumber(prefix = 'ART') {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const datePrefix = `${year}-${month}-${day}`;
      
      // Ищем все заказы с этим префиксом за сегодня
      const orders = await prisma.order.findMany({
        where: {
          orderNumber: {
            startsWith: `${prefix}-${datePrefix}-`
          }
        },
        select: {
          orderNumber: true
        },
        orderBy: {
          orderNumber: 'desc'
        }
      });

      let nextNumber = 1;
      
      if (orders.length > 0) {
        const lastOrder = orders[0];
        const lastNumber = lastOrder.orderNumber.split('-').pop();
        nextNumber = parseInt(lastNumber, 10) + 1;
      }

      return `${prefix}-${datePrefix}-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      logger.error('Error getting next available number', { 
        prefix, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new OrderNumberingService();
