const Joi = require('joi');

// Updated schema for picture creation - v5 with imageUrl support
const createPictureSchema = Joi.object({
  orderId: Joi.string().optional(),
  pictureSizeId: Joi.string().required(),
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('READY_MADE', 'CUSTOM_PHOTO').required(),
  status: Joi.string().valid('IN_PROGRESS', 'COMPLETED', 'CANCELLED').optional(),
  price: Joi.number().positive().required(),
  workHours: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional(),
  imageUrl: Joi.string().uri().optional(),
  materials: Joi.array().items(
    Joi.object({
      materialId: Joi.string().required(),
      quantity: Joi.number().positive().required()
    })
  ).optional()
});

const updatePictureSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(500).optional(),
  status: Joi.string().valid('IN_PROGRESS', 'COMPLETED', 'CANCELLED').optional(),
  price: Joi.number().positive().optional(),
  workHours: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional(),
  imageUrl: Joi.string().uri().optional()
});

const updatePictureStatusSchema = Joi.object({
  status: Joi.string().valid('IN_PROGRESS', 'COMPLETED', 'CANCELLED').required()
});

const addMaterialsSchema = Joi.object({
  materials: Joi.array().items(
    Joi.object({
      materialId: Joi.string().required(),
      quantity: Joi.number().positive().required()
    })
  ).min(1).required()
});

module.exports = {
  createPictureSchema,
  updatePictureSchema,
  updatePictureStatusSchema,
  addMaterialsSchema
};
