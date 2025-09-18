const express = require('express');
const router = express.Router();

const {
  getMaterialsWithStock,
  getLowStockMaterials,
  addMaterialToStock,
  removeMaterialFromStock,
  getMaterialMovements,
  getAllMovements,
  adjustStock,
  getWarehouseStats
} = require('../controllers/warehouseController');

const { validateRequest } = require('../validators/common');
const Joi = require('joi');

// Схемы валидации
const addMaterialSchema = Joi.object({
  materialId: Joi.string().required(),
  quantity: Joi.number().positive().required(),
  reason: Joi.string().min(1).max(200).required(),
  referenceId: Joi.string().optional(),
  referenceType: Joi.string().valid('ORDER', 'PICTURE', 'PURCHASE', 'MANUAL').optional(),
  notes: Joi.string().max(500).optional()
});

const removeMaterialSchema = Joi.object({
  materialId: Joi.string().required(),
  quantity: Joi.number().positive().required(),
  reason: Joi.string().min(1).max(200).required(),
  referenceId: Joi.string().optional(),
  referenceType: Joi.string().valid('ORDER', 'PICTURE', 'PURCHASE', 'MANUAL').optional(),
  notes: Joi.string().max(500).optional()
});

const adjustStockSchema = Joi.object({
  materialId: Joi.string().required(),
  newQuantity: Joi.number().required(),
  reason: Joi.string().min(1).max(200).required(),
  notes: Joi.string().max(500).optional()
});

// Получить все материалы с остатками
router.get('/materials', getMaterialsWithStock);

// Получить материалы с низким остатком
router.get('/materials/low-stock', getLowStockMaterials);

// Добавить материал на склад
router.post('/materials/add', 
  validateRequest(addMaterialSchema), 
  addMaterialToStock
);

// Списать материал со склада
router.post('/materials/remove', 
  validateRequest(removeMaterialSchema), 
  removeMaterialFromStock
);

// Корректировка остатка
router.post('/materials/adjust', 
  validateRequest(adjustStockSchema), 
  adjustStock
);

// Получить историю движений материала
router.get('/materials/:materialId/movements', getMaterialMovements);

// Получить все движения материалов
router.get('/movements', getAllMovements);

// Получить статистику склада
router.get('/stats', getWarehouseStats);

module.exports = router;
