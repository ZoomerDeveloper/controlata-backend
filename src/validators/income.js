const Joi = require('joi');

const createIncomeSchema = Joi.object({
  orderId: Joi.string().optional(),
  amount: Joi.number().positive().required(),
  description: Joi.string().min(1).max(200).required(),
  category: Joi.string().valid('SALES', 'OTHER').required(),
  date: Joi.date().iso().optional(),
  notes: Joi.string().max(500).optional()
});

const updateIncomeSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  description: Joi.string().min(1).max(200).optional(),
  category: Joi.string().valid('SALES', 'OTHER').optional(),
  date: Joi.date().iso().optional(),
  notes: Joi.string().max(500).optional()
});

const incomeStatsSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  groupBy: Joi.string().valid('day', 'month', 'year').default('month')
});

module.exports = {
  createIncomeSchema,
  updateIncomeSchema,
  incomeStatsSchema
};
