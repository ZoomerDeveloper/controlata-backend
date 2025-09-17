const express = require('express');
const router = express.Router();

const {
  getAllPictures,
  getPictureById,
  createPicture,
  updatePicture,
  deletePicture,
  addMaterialsToPicture,
  updatePictureStatus,
  calculatePictureCost
} = require('../controllers/pictureController');
const { validateRequest, validateQuery, paginationSchema } = require('../validators/common');
const { 
  createPictureSchema, 
  updatePictureSchema, 
  updatePictureStatusSchema,
  addMaterialsSchema 
} = require('../validators/picture');

// Получить все картины
router.get('/', 
  validateQuery(paginationSchema), 
  getAllPictures
);

// Получить картину по ID
router.get('/:id', getPictureById);

// Создать новую картину
router.post('/', 
  validateRequest(createPictureSchema), 
  createPicture
);

// Обновить картину
router.put('/:id', 
  validateRequest(updatePictureSchema), 
  updatePicture
);

// Обновить статус картины
router.patch('/:id/status', 
  validateRequest(updatePictureStatusSchema), 
  updatePictureStatus
);

// Добавить материалы к картине
router.post('/:id/materials', 
  validateRequest(addMaterialsSchema), 
  addMaterialsToPicture
);

// Рассчитать себестоимость картины
router.get('/:id/cost', calculatePictureCost);

// Удалить картину
router.delete('/:id', deletePicture);

module.exports = router;
