const warehouseService = require('../services/warehouseService');
const logger = require('../utils/logger');

// Получить все материалы с остатками
const getMaterialsWithStock = async (req, res) => {
  try {
    logger.info('Getting materials with stock', { query: req.query });
    
    const materials = await warehouseService.getMaterialsWithStock();
    
    res.json({
      materials,
      total: materials.length
    });
  } catch (error) {
    logger.error('Get materials with stock error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Ошибка при получении материалов со склада',
      details: error.message
    });
  }
};

// Получить материалы с низким остатком
const getLowStockMaterials = async (req, res) => {
  try {
    logger.info('Getting low stock materials');
    
    const materials = await warehouseService.getLowStockMaterials();
    
    res.json({
      materials,
      total: materials.length
    });
  } catch (error) {
    logger.error('Get low stock materials error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Ошибка при получении материалов с низким остатком',
      details: error.message
    });
  }
};

// Добавить материал на склад
const addMaterialToStock = async (req, res) => {
  try {
    const {
      materialId,
      quantity,
      reason,
      referenceId,
      referenceType,
      notes
    } = req.body;

    logger.info('Adding material to stock', {
      materialId,
      quantity,
      reason
    });

    const result = await warehouseService.addMaterialToStock(
      materialId,
      quantity,
      reason,
      referenceId,
      referenceType,
      notes
    );

    res.json({
      message: 'Материал успешно добавлен на склад',
      data: result
    });
  } catch (error) {
    logger.error('Add material to stock error', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({
      error: 'Ошибка при добавлении материала на склад',
      details: error.message
    });
  }
};

// Списать материал со склада
const removeMaterialFromStock = async (req, res) => {
  try {
    const {
      materialId,
      quantity,
      reason,
      referenceId,
      referenceType,
      notes
    } = req.body;

    logger.info('Removing material from stock', {
      materialId,
      quantity,
      reason
    });

    const result = await warehouseService.removeMaterialFromStock(
      materialId,
      quantity,
      reason,
      referenceId,
      referenceType,
      notes
    );

    res.json({
      message: 'Материал успешно списан со склада',
      data: result,
      warning: result.isNegative ? 'Внимание: остаток ушел в минус!' : null
    });
  } catch (error) {
    logger.error('Remove material from stock error', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({
      error: 'Ошибка при списании материала со склада',
      details: error.message
    });
  }
};

// Получить историю движений материала
const getMaterialMovements = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { limit = 50 } = req.query;

    logger.info('Getting material movements', { materialId, limit });

    const movements = await warehouseService.getMaterialMovements(materialId, parseInt(limit));

    res.json({
      movements,
      total: movements.length
    });
  } catch (error) {
    logger.error('Get material movements error', {
      error: error.message,
      stack: error.stack,
      params: req.params
    });
    res.status(500).json({
      error: 'Ошибка при получении истории движений материала',
      details: error.message
    });
  }
};

// Получить все движения материалов
const getAllMovements = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    logger.info('Getting all movements', { limit });

    const movements = await warehouseService.getAllMovements(parseInt(limit));

    res.json({
      movements,
      total: movements.length
    });
  } catch (error) {
    logger.error('Get all movements error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Ошибка при получении всех движений материалов',
      details: error.message
    });
  }
};

// Корректировка остатка
const adjustStock = async (req, res) => {
  try {
    const {
      materialId,
      newQuantity,
      reason,
      notes
    } = req.body;

    logger.info('Adjusting stock', {
      materialId,
      newQuantity,
      reason
    });

    const result = await warehouseService.adjustStock(
      materialId,
      newQuantity,
      reason,
      notes
    );

    res.json({
      message: 'Остаток успешно скорректирован',
      data: result
    });
  } catch (error) {
    logger.error('Adjust stock error', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({
      error: 'Ошибка при корректировке остатка',
      details: error.message
    });
  }
};

// Получить статистику склада
const getWarehouseStats = async (req, res) => {
  try {
    logger.info('Getting warehouse stats');

    const stats = await warehouseService.getWarehouseStats();

    res.json({
      stats
    });
  } catch (error) {
    logger.error('Get warehouse stats error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Ошибка при получении статистики склада',
      details: error.message
    });
  }
};

module.exports = {
  getMaterialsWithStock,
  getLowStockMaterials,
  addMaterialToStock,
  removeMaterialFromStock,
  getMaterialMovements,
  getAllMovements,
  adjustStock,
  getWarehouseStats
};
