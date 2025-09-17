const Joi = require('joi');

const createOrderSchema = Joi.object({
  customerName: Joi.string().min(2).max(100).optional(),
  customerEmail: Joi.string().email().optional(),
  customerPhone: Joi.string().min(10).max(20).optional(),
  dueDate: Joi.date().iso().optional(),
  notes: Joi.string().max(1000).optional(),
  pictures: Joi.array().items(
    Joi.object({
      pictureSizeId: Joi.string().required(),
      name: Joi.string().min(1).max(200).required(),
      description: Joi.string().max(500).optional(),
      type: Joi.string().valid('READY_MADE', 'CUSTOM_PHOTO').required(),
      price: Joi.number().positive().required(),
      workHours: Joi.number().min(0).optional(),
      notes: Joi.string().max(500).optional()
    })
  ).min(1).required()
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
