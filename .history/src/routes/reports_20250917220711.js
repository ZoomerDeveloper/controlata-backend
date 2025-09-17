const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { validateRequest, validateQuery, paginationSchema } = require('../validators/common');

// Валидация для создания отчетов
const reportPeriodSchema = require('joi').object({
  startDate: require('joi').date().iso().required(),
  endDate: require('joi').date().iso().min(require('joi').ref('startDate')).required()
});

// Получить все отчеты
router.get('/', 
  validateQuery(paginationSchema), 
  reportController.getAllReports
);

// Получить отчет по ID
router.get('/:id', reportController.getReportById);

// Создать отчет P&L
router.post('/profit-loss', 
  validateRequest(reportPeriodSchema), 
  reportController.generateProfitLossReport
);

// Создать отчет движения денег
router.post('/cash-flow', 
  validateRequest(reportPeriodSchema), 
  reportController.generateCashFlowReport
);

// Создать отчет анализа продуктов
router.post('/product-analysis', 
  validateRequest(reportPeriodSchema), 
  reportController.generateProductAnalysisReport
);

// Удалить отчет
router.delete('/:id', reportController.deleteReport);

module.exports = router;
