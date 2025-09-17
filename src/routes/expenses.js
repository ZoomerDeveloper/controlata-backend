const express = require('express');
const router = express.Router();

const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
} = require('../controllers/expenseController');
const { validateRequest, validateQuery, paginationSchema } = require('../validators/common');
const { 
  createExpenseSchema, 
  updateExpenseSchema,
  expenseStatsSchema 
} = require('../validators/expense');

// Получить все расходы
router.get('/', 
  validateQuery(paginationSchema), 
  getAllExpenses
);

// Получить статистику расходов
router.get('/stats', 
  validateQuery(expenseStatsSchema), 
  getExpenseStats
);

// Получить расход по ID
router.get('/:id', getExpenseById);

// Создать новый расход
router.post('/', 
  validateRequest(createExpenseSchema), 
  createExpense
);

// Обновить расход
router.put('/:id', 
  validateRequest(updateExpenseSchema), 
  updateExpense
);

// Удалить расход
router.delete('/:id', deleteExpense);

module.exports = router;
