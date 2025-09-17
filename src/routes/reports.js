const express = require('express');
const router = express.Router();

const {
  generateProfitLossReport,
  generateCashFlowReport,
  generateProductAnalysisReport,
  getAllReports,
  getReportById,
  deleteReport
} = require('../controllers/reportController');
const { validateRequest, validateQuery, paginationSchema } = require('../validators/common');

// Валидация для создания отчетов
const reportPeriodSchema = require('joi').object({
  startDate: require('joi').date().iso().required(),
  endDate: require('joi').date().iso().min(require('joi').ref('startDate')).required()
});

// Получить все отчеты
router.get('/', 
  validateQuery(paginationSchema), 
  getAllReports
);

// Получить отчет по ID
router.get('/:id', getReportById);

// Создать отчет P&L
router.post('/profit-loss', 
  validateRequest(reportPeriodSchema), 
  generateProfitLossReport
);

// Создать отчет движения денег
router.post('/cash-flow', 
  validateRequest(reportPeriodSchema), 
  generateCashFlowReport
);

// Создать отчет анализа продуктов
router.post('/product-analysis', 
  validateRequest(reportPeriodSchema), 
  generateProductAnalysisReport
);

// Удалить отчет
router.delete('/:id', deleteReport);

module.exports = router;
