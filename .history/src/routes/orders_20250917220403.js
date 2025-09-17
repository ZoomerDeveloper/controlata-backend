const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { validateRequest, validateQuery, paginationSchema } = require('../validators/common');
const { 
  createOrderSchema, 
  updateOrderSchema, 
  updateOrderStatusSchema,
  dateRangeSchema 
} = require('../validators/order');

// Получить все заказы
router.get('/', 
  validateQuery(paginationSchema), 
  orderController.getAllOrders
);

// Получить заказы по датам
router.get('/by-date-range', 
  validateQuery(dateRangeSchema), 
  orderController.getOrdersByDateRange
);

// Получить заказ по ID
router.get('/:id', orderController.getOrderById);

// Создать новый заказ
router.post('/', 
  validateRequest(createOrderSchema), 
  orderController.createOrder
);

// Обновить заказ
router.put('/:id', 
  validateRequest(updateOrderSchema), 
  orderController.updateOrder
);

// Обновить статус заказа
router.patch('/:id/status', 
  validateRequest(updateOrderStatusSchema), 
  orderController.updateOrderStatus
);

// Удалить заказ
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
