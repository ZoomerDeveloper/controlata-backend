const Joi = require('joi');

// Схема для готовых картин
const readyMadePictureSchema = Joi.object({
  pictureId: Joi.string().required(),
  price: Joi.number().positive().required(),
  quantity: Joi.number().positive().default(1).optional(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('READY_MADE').required()
});

// Схема для картин по фото
const customPhotoPictureSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  pictureSizeId: Joi.string().required(),
  photo: Joi.string().optional(), // Сделаем опциональным
  imageUrl: Joi.string().optional(), // Добавим imageUrl
  price: Joi.number().positive().required(),
  quantity: Joi.number().positive().default(1).optional(),
  description: Joi.string().max(500).optional(),
  workHours: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional(),
  type: Joi.string().valid('CUSTOM_PHOTO').required()
});

// Updated schema for order creation - v3
const createOrderSchema = Joi.object({
  orderNumber: Joi.string().min(1).max(50).optional(),
  customerName: Joi.string().min(2).max(100).optional(),
  customerEmail: Joi.string().email().optional(),
  customerPhone: Joi.string().min(10).max(20).optional(),
  totalPrice: Joi.number().positive().optional(),
  orderDate: Joi.date().iso().optional(),
  dueDate: Joi.date().iso().optional(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELIVERED').optional(),
  notes: Joi.string().max(1000).optional(),
  pictures: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('READY_MADE', 'CUSTOM_PHOTO').required(),
      price: Joi.number().positive().required(),
      quantity: Joi.number().positive().default(1).optional(),
      description: Joi.string().max(500).optional(),
      pictureId: Joi.string().optional(),
      name: Joi.string().min(1).max(200).optional(),
      pictureSizeId: Joi.string().optional(),
      photo: Joi.alternatives().try(
        Joi.string(),
        Joi.any().allow(null, undefined)
      ).optional(),
      imageUrl: Joi.any().optional(),
      workHours: Joi.number().min(0).optional(),
      notes: Joi.string().max(500).optional()
    })
  ).optional()
});

const updateOrderSchema = Joi.object({
  customerName: Joi.string().min(2).max(100).optional(),
  customerEmail: Joi.string().email().optional(),
  customerPhone: Joi.string().min(10).max(20).optional(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELIVERED').optional(),
  dueDate: Joi.date().iso().optional(),
  notes: Joi.string().max(1000).optional(),
  totalPrice: Joi.number().positive().optional()
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELIVERED').required()
});

const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELIVERED').optional()
});

module.exports = {
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  dateRangeSchema
};