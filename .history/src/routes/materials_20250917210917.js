const express = require('express');
const router = express.Router();

const materialController = require('../controllers/materialController');
const { validateRequest, validateQuery, paginationSchema } = require('../validators/common');
const Joi = require('joi');

// Валидация для создания/обновления материала
const createMaterialSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  unit: Joi.string().min(1).max(20).required(),
  category: Joi.string().valid('CANVAS', 'PAINT', 'BRUSH', 'FRAME', 'NUMBER', 'PACKAGING', 'OTHER').required(),
  pictureSizeId: Joi.string().optional()
});

const updateMaterialSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional(),
  unit: Joi.string().min(1).max(20).optional(),
  category: Joi.string().valid('CANVAS', 'PAINT', 'BRUSH', 'FRAME', 'NUMBER', 'PACKAGING', 'OTHER').optional(),
  pictureSizeId: Joi.string().optional(),
  isActive: Joi.boolean().optional()
});

// Валидация для закупки материала
const createPurchaseSchema = Joi.object({
  materialId: Joi.string().required(),
  quantity: Joi.number().positive().required(),
  unitPrice: Joi.number().positive().required(),
  supplier: Joi.string().max(100).optional(),
  notes: Joi.string().max(500).optional()
});

// Валидация для обновления уровня остатка
const updateStockLevelSchema = Joi.object({
  minLevel: Joi.number().min(0).required()
});

// Получить все материалы
router.get('/', 
  validateQuery(paginationSchema), 
  materialController.getAllMaterials
);

// Получить материал по ID
router.get('/:id', materialController.getMaterialById);

// Создать новый материал
router.post('/', 
  validateRequest(createMaterialSchema), 
  materialController.createMaterial
);

// Обновить материал
router.put('/:id', 
  validateRequest(updateMaterialSchema), 
  materialController.updateMaterial
);

// Удалить материал
router.delete('/:id', materialController.deleteMaterial);

// Создать закупку материала
router.post('/:id/purchases', 
  validateRequest(createPurchaseSchema), 
  materialController.createMaterialPurchase
);

// Получить закупки материалов
router.get('/purchases/all', 
  validateQuery(paginationSchema), 
  materialController.getMaterialPurchases
);

// Обновить минимальный уровень остатка
router.put('/:materialId/stock-level', 
  validateRequest(updateStockLevelSchema), 
  materialController.updateStockLevel
);

// Получить материалы с низким остатком
router.get('/low-stock/list', materialController.getLowStockMaterials);

module.exports = router;
