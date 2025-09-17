const express = require('express');
const router = express.Router();

const {
  getAllOrders,
  getOrdersByDateRange,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');
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
  getAllOrders
);

// Получить заказы по датам
router.get('/by-date-range', 
  validateQuery(dateRangeSchema), 
  getOrdersByDateRange
);

// Получить заказ по ID
router.get('/:id', getOrderById);

// Создать новый заказ
router.post('/', 
  validateRequest(createOrderSchema), 
  createOrder
);

// Обновить заказ
router.put('/:id', 
  validateRequest(updateOrderSchema), 
  updateOrder
);

// Обновить статус заказа
router.patch('/:id/status', 
  validateRequest(updateOrderStatusSchema), 
  updateOrderStatus
);

// Удалить заказ
router.delete('/:id', deleteOrder);

module.exports = router;
