const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Некорректный формат email',
      'any.required': 'Email обязателен'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Пароль должен содержать минимум 6 символов',
      'any.required': 'Пароль обязателен'
    }),
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Имя должно содержать минимум 2 символа',
      'string.max': 'Имя не должно превышать 50 символов',
      'any.required': 'Имя обязательно'
    }),
  role: Joi.string()
    .valid('ADMIN', 'MANAGER', 'ACCOUNTANT')
    .default('ADMIN')
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Некорректный формат email',
      'any.required': 'Email обязателен'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Пароль обязателен'
    })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Текущий пароль обязателен'
    }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Новый пароль должен содержать минимум 6 символов',
      'any.required': 'Новый пароль обязателен'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema
};
