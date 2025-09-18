const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    console.log('🔍 Валидация запроса:', {
      body: req.body,
      pictures: req.body.pictures,
      picturesCount: req.body.pictures?.length || 0
    });
    
    // Логируем каждую картину отдельно
    if (req.body.pictures && req.body.pictures.length > 0) {
      req.body.pictures.forEach((picture, index) => {
        console.log(`🔍 Картина ${index}:`, {
          type: picture.type,
          hasPictureId: !!picture.pictureId,
          hasName: !!picture.name,
          hasPictureSizeId: !!picture.pictureSizeId,
          price: picture.price,
          keys: Object.keys(picture)
        });
      });
    }
    
    const { error } = schema.validate(req.body);
    
    if (error) {
      console.error('❌ Ошибка валидации:', {
        error: error.details,
        body: req.body,
        pictures: req.body.pictures
      });
      
      const errorMessage = error.details[0].message;
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: errorMessage
      });
    }
    
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      const errorMessage = error.details[0].message;
      return res.status(400).json({
        error: 'Ошибка валидации запроса',
        details: errorMessage
      });
    }
    
    next();
  };
};

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate'))
});

module.exports = {
  validateRequest,
  validateQuery,
  paginationSchema,
  dateRangeSchema
};
