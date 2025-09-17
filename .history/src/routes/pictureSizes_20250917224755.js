const express = require('express');
const router = express.Router();

const {
  getAllPictureSizes,
  getPictureSizeById,
  createPictureSize,
  updatePictureSize,
  deletePictureSize
} = require('../controllers/pictureSizeController');
const { validateRequest, validateQuery, paginationSchema } = require('../validators/common');

// Валидация для создания/обновления размера картины
const createPictureSizeSchema = require('joi').object({
  name: require('joi').string().min(1).max(50).required(),
  width: require('joi').number().positive().required(),
  height: require('joi').number().positive().required(),
  description: require('joi').string().max(500).optional()
});

const updatePictureSizeSchema = require('joi').object({
  name: require('joi').string().min(1).max(50).optional(),
  width: require('joi').number().positive().optional(),
  height: require('joi').number().positive().optional(),
  description: require('joi').string().max(500).optional(),
  isActive: require('joi').boolean().optional()
});

// Получить все размеры картин
router.get('/', 
  validateQuery(paginationSchema), 
  pictureSizeController.getAllPictureSizes
);

// Получить размер картины по ID
router.get('/:id', pictureSizeController.getPictureSizeById);

// Создать новый размер картины
router.post('/', 
  validateRequest(createPictureSizeSchema), 
  pictureSizeController.createPictureSize
);

// Обновить размер картины
router.put('/:id', 
  validateRequest(updatePictureSizeSchema), 
  pictureSizeController.updatePictureSize
);

// Удалить размер картины
router.delete('/:id', pictureSizeController.deletePictureSize);

module.exports = router;
