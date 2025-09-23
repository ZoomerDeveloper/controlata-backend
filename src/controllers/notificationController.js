const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Получает все уведомления с фильтрацией
 */
const getNotifications = async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      isRead,
      severity,
      type
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : null,
      severity,
      type
    };

    const notifications = await notificationService.getNotifications(options);
    const stats = await notificationService.getNotificationStats();

    res.json({
      notifications,
      stats,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: stats.total
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Ошибка при получении уведомлений'
    });
  }
};

/**
 * Отмечает уведомление как прочитанное
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    await notificationService.markAsRead(id);
    
    res.json({
      message: 'Уведомление отмечено как прочитанное'
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении уведомления'
    });
  }
};

/**
 * Отмечает все уведомления как прочитанные
 */
const markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead();
    
    res.json({
      message: 'Все уведомления отмечены как прочитанные'
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении уведомлений'
    });
  }
};

/**
 * Проверяет остатки материалов и создает уведомления
 */
const checkLowStock = async (req, res) => {
  try {
    const result = await notificationService.checkLowStockMaterials();
    
    res.json({
      message: 'Проверка остатков завершена',
      ...result
    });
  } catch (error) {
    logger.error('Check low stock error:', error);
    res.status(500).json({
      error: 'Ошибка при проверке остатков'
    });
  }
};

/**
 * Получает статистику уведомлений
 */
const getStats = async (req, res) => {
  try {
    const stats = await notificationService.getNotificationStats();
    
    res.json({ stats });
  } catch (error) {
    logger.error('Get notification stats error:', error);
    res.status(500).json({
      error: 'Ошибка при получении статистики уведомлений'
    });
  }
};

/**
 * Удаляет старые уведомления
 */
const cleanupOld = async (req, res) => {
  try {
    const deletedCount = await notificationService.cleanupOldNotifications();
    
    res.json({
      message: 'Очистка старых уведомлений завершена',
      deletedCount
    });
  } catch (error) {
    logger.error('Cleanup old notifications error:', error);
    res.status(500).json({
      error: 'Ошибка при очистке уведомлений'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  checkLowStock,
  getStats,
  cleanupOld
};
