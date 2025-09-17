const express = require('express');
const router = express.Router();

const {
  getAllIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeStats
} = require('../controllers/incomeController');
const { validateRequest, validateQuery, paginationSchema } = require('../validators/common');
const { 
  createIncomeSchema, 
  updateIncomeSchema,
  incomeStatsSchema 
} = require('../validators/income');

// Получить все доходы
router.get('/', 
  validateQuery(paginationSchema), 
  getAllIncomes
);

// Получить статистику доходов
router.get('/stats', 
  validateQuery(incomeStatsSchema), 
  getIncomeStats
);

// Получить доход по ID
router.get('/:id', getIncomeById);

// Создать новый доход
router.post('/', 
  validateRequest(createIncomeSchema), 
  createIncome
);

// Обновить доход
router.put('/:id', 
  validateRequest(updateIncomeSchema), 
  updateIncome
);

// Удалить доход
router.delete('/:id', deleteIncome);

module.exports = router;
