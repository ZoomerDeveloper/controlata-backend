const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class NotificationService {
  /**
   * Проверяет остатки материалов и создает уведомления о низких остатках
   * @returns {Promise<Object>} - Результат проверки с количеством уведомлений
   */
  async checkLowStockMaterials() {
    try {
      logger.info('Checking low stock materials...');

      // Получаем материалы с низкими остатками
      const lowStockMaterials = await prisma.material.findMany({
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
          stocks: true
        }
      });

      const notifications = [];
      let criticalCount = 0;
      let warningCount = 0;

      for (const material of lowStockMaterials) {
        const stock = material.stocks[0];
        if (!stock) continue;

        const currentQuantity = stock.quantity;
        const minLevel = stock.minLevel || 0;
        const criticalLevel = minLevel * 0.5; // Критический уровень - 50% от минимального

        let severity = 'WARNING';
        if (currentQuantity <= criticalLevel) {
          severity = 'CRITICAL';
          criticalCount++;
        } else {
          warningCount++;
        }

        const notification = {
          type: 'LOW_STOCK',
          severity,
          materialId: material.id,
          materialName: material.name,
          currentQuantity,
          minLevel,
          criticalLevel,
          unit: material.unit,
          category: material.category,
          message: this.generateStockMessage(material, currentQuantity, minLevel, criticalLevel, severity)
        };

        notifications.push(notification);

        // Сохраняем уведомление в базу данных
        await this.saveNotification(notification);
      }

      logger.info('Low stock check completed', {
        totalMaterials: lowStockMaterials.length,
        criticalCount,
        warningCount,
        notifications: notifications.length
      });

      return {
        success: true,
        totalMaterials: lowStockMaterials.length,
        criticalCount,
        warningCount,
        notifications
      };
    } catch (error) {
      logger.error('Error checking low stock materials', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Генерирует сообщение для уведомления о низком остатке
   * @param {Object} material - Материал
   * @param {number} currentQuantity - Текущий остаток
   * @param {number} minLevel - Минимальный уровень
   * @param {number} criticalLevel - Критический уровень
   * @param {string} severity - Уровень критичности
   * @returns {string} - Сообщение уведомления
   */
  generateStockMessage(material, currentQuantity, minLevel, criticalLevel, severity) {
    const remaining = Math.max(0, minLevel - currentQuantity);
    
    if (severity === 'CRITICAL') {
      return `🚨 КРИТИЧЕСКИЙ ОСТАТОК: ${material.name} - осталось ${currentQuantity} ${material.unit}, требуется пополнить на ${remaining} ${material.unit}`;
    } else {
      return `⚠️ Низкий остаток: ${material.name} - осталось ${currentQuantity} ${material.unit}, минимальный уровень: ${minLevel} ${material.unit}`;
    }
  }

  /**
   * Сохраняет уведомление в базу данных
   * @param {Object} notification - Данные уведомления
   * @returns {Promise<void>}
   */
  async saveNotification(notification) {
    try {
      await prisma.notification.create({
        data: {
          type: notification.type,
          severity: notification.severity,
          title: this.getNotificationTitle(notification.type, notification.severity),
          message: notification.message,
          data: {
            materialId: notification.materialId,
            materialName: notification.materialName,
            currentQuantity: notification.currentQuantity,
            minLevel: notification.minLevel,
            criticalLevel: notification.criticalLevel,
            unit: notification.unit,
            category: notification.category
          },
          isRead: false
        }
      });
    } catch (error) {
      logger.error('Error saving notification', {
        notification,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Получает заголовок уведомления
   * @param {string} type - Тип уведомления
   * @param {string} severity - Уровень критичности
   * @returns {string} - Заголовок
   */
  getNotificationTitle(type, severity) {
    if (type === 'LOW_STOCK') {
      return severity === 'CRITICAL' ? 'Критически низкий остаток материала' : 'Низкий остаток материала';
    }
    return 'Уведомление системы';
  }

  /**
   * Получает все уведомления
   * @param {Object} options - Опции фильтрации
   * @returns {Promise<Array>} - Список уведомлений
   */
  async getNotifications(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        isRead = null,
        severity = null,
        type = null
      } = options;

      const where = {};
      if (isRead !== null) where.isRead = isRead;
      if (severity) where.severity = severity;
      if (type) where.type = type;

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      });

      return notifications;
    } catch (error) {
      logger.error('Error getting notifications', {
        options,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Отмечает уведомление как прочитанное
   * @param {string} notificationId - ID уведомления
   * @returns {Promise<void>}
   */
  async markAsRead(notificationId) {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
    } catch (error) {
      logger.error('Error marking notification as read', {
        notificationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Отмечает все уведомления как прочитанные
   * @returns {Promise<void>}
   */
  async markAllAsRead() {
    try {
      await prisma.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true }
      });
    } catch (error) {
      logger.error('Error marking all notifications as read', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Удаляет старые уведомления (старше 30 дней)
   * @returns {Promise<number>} - Количество удаленных уведомлений
   */
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          isRead: true
        }
      });

      logger.info('Cleaned up old notifications', {
        deletedCount: result.count
      });

      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old notifications', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Получает статистику уведомлений
   * @returns {Promise<Object>} - Статистика уведомлений
   */
  async getNotificationStats() {
    try {
      const total = await prisma.notification.count();
      const unread = await prisma.notification.count({
        where: { isRead: false }
      });
      const critical = await prisma.notification.count({
        where: { severity: 'CRITICAL', isRead: false }
      });
      const warning = await prisma.notification.count({
        where: { severity: 'WARNING', isRead: false }
      });

      return {
        total,
        unread,
        critical,
        warning,
        read: total - unread
      };
    } catch (error) {
      logger.error('Error getting notification stats', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new NotificationService();
