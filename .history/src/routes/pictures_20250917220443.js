const express = require('express');
const router = express.Router();

const pictureController = require('../controllers/pictureController');
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
  pictureController.getAllPictures
);

// Получить картину по ID
router.get('/:id', pictureController.getPictureById);

// Создать новую картину
router.post('/', 
  validateRequest(createPictureSchema), 
  pictureController.createPicture
);

// Обновить картину
router.put('/:id', 
  validateRequest(updatePictureSchema), 
  pictureController.updatePicture
);

// Обновить статус картины
router.patch('/:id/status', 
  validateRequest(updatePictureStatusSchema), 
  pictureController.updatePictureStatus
);

// Добавить материалы к картине
router.post('/:id/materials', 
  validateRequest(addMaterialsSchema), 
  pictureController.addMaterialsToPicture
);

// Рассчитать себестоимость картины
router.get('/:id/cost', pictureController.calculatePictureCost);

// Удалить картину
router.delete('/:id', pictureController.deletePicture);

module.exports = router;
