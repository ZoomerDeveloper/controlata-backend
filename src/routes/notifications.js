const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// Все маршруты требуют аутентификации
router.use(auth);

// GET /api/notifications - Получить все уведомления
router.get('/', notificationController.getNotifications);

// GET /api/notifications/stats - Получить статистику уведомлений
router.get('/stats', notificationController.getStats);

// POST /api/notifications/check-low-stock - Проверить низкие остатки
router.post('/check-low-stock', notificationController.checkLowStock);

// PATCH /api/notifications/:id/read - Отметить уведомление как прочитанное
router.patch('/:id/read', notificationController.markAsRead);

// PATCH /api/notifications/mark-all-read - Отметить все уведомления как прочитанные
router.patch('/mark-all-read', notificationController.markAllAsRead);

// DELETE /api/notifications/cleanup - Удалить старые уведомления
router.delete('/cleanup', notificationController.cleanupOld);

module.exports = router;
