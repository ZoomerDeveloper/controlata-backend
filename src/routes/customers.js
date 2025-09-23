const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');

// Все маршруты требуют аутентификации
router.use(auth);

// GET /api/customers - Получить всех клиентов
router.get('/', customerController.getAllCustomers);

// GET /api/customers/stats - Получить статистику клиентов
router.get('/stats', customerController.getCustomerStats);

// GET /api/customers/:id - Получить клиента по ID
router.get('/:id', customerController.getCustomerById);

// POST /api/customers - Создать нового клиента
router.post('/', customerController.createCustomer);

// PUT /api/customers/:id - Обновить клиента
router.put('/:id', customerController.updateCustomer);

// DELETE /api/customers/:id - Удалить клиента
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
