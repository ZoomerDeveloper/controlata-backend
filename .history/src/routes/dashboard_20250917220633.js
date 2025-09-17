const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { validateQuery } = require('../validators/common');

// Получить общую статистику дашборда
router.get('/', 
  validateQuery(require('joi').object({
    period: require('joi').string().valid('week', 'month', 'quarter', 'year').default('month')
  })), 
  dashboardController.getDashboardStats
);

// Получить финансовый обзор
router.get('/financial', 
  validateQuery(require('joi').object({
    startDate: require('joi').date().iso().optional(),
    endDate: require('joi').date().iso().min(require('joi').ref('startDate')).optional()
  })), 
  dashboardController.getFinancialOverview
);

// Получить аналитику продуктов
router.get('/products', 
  validateQuery(require('joi').object({
    startDate: require('joi').date().iso().optional(),
    endDate: require('joi').date().iso().min(require('joi').ref('startDate')).optional()
  })), 
  dashboardController.getProductAnalytics
);

module.exports = router;
