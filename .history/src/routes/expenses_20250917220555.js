const express = require('express');
const router = express.Router();

const expenseController = require('../controllers/expenseController');
const { validateRequest, validateQuery, paginationSchema } = require('../validators/common');
const { 
  createExpenseSchema, 
  updateExpenseSchema,
  expenseStatsSchema 
} = require('../validators/expense');

// Получить все расходы
router.get('/', 
  validateQuery(paginationSchema), 
  expenseController.getAllExpenses
);

// Получить статистику расходов
router.get('/stats', 
  validateQuery(expenseStatsSchema), 
  expenseController.getExpenseStats
);

// Получить расход по ID
router.get('/:id', expenseController.getExpenseById);

// Создать новый расход
router.post('/', 
  validateRequest(createExpenseSchema), 
  expenseController.createExpense
);

// Обновить расход
router.put('/:id', 
  validateRequest(updateExpenseSchema), 
  expenseController.updateExpense
);

// Удалить расход
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
