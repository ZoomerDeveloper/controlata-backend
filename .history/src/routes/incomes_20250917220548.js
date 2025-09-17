const express = require('express');
const router = express.Router();

const incomeController = require('../controllers/incomeController');
const { validateRequest, validateQuery, paginationSchema } = require('../validators/common');
const { 
  createIncomeSchema, 
  updateIncomeSchema,
  incomeStatsSchema 
} = require('../validators/income');

// Получить все доходы
router.get('/', 
  validateQuery(paginationSchema), 
  incomeController.getAllIncomes
);

// Получить статистику доходов
router.get('/stats', 
  validateQuery(incomeStatsSchema), 
  incomeController.getIncomeStats
);

// Получить доход по ID
router.get('/:id', incomeController.getIncomeById);

// Создать новый доход
router.post('/', 
  validateRequest(createIncomeSchema), 
  incomeController.createIncome
);

// Обновить доход
router.put('/:id', 
  validateRequest(updateIncomeSchema), 
  incomeController.updateIncome
);

// Удалить доход
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;
