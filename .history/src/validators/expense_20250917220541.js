const Joi = require('joi');

const createExpenseSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().min(1).max(200).required(),
  category: Joi.string().valid('MATERIALS', 'PRODUCTION', 'LOGISTICS', 'RENT', 'MARKETING', 'OTHER').required(),
  date: Joi.date().iso().optional(),
  notes: Joi.string().max(500).optional(),
  receipt: Joi.string().max(500).optional()
});

const updateExpenseSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  description: Joi.string().min(1).max(200).optional(),
  category: Joi.string().valid('MATERIALS', 'PRODUCTION', 'LOGISTICS', 'RENT', 'MARKETING', 'OTHER').optional(),
  date: Joi.date().iso().optional(),
  notes: Joi.string().max(500).optional(),
  receipt: Joi.string().max(500).optional()
});

const expenseStatsSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  groupBy: Joi.string().valid('day', 'month', 'year').default('month')
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
  expenseStatsSchema
};
