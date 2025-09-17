const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { validateRequest } = require('../validators/common');
const { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema 
} = require('../validators/auth');
const authMiddleware = require('../middleware/auth');

// Регистрация
router.post('/register', 
  validateRequest(registerSchema), 
  register
);

// Вход
router.post('/login', 
  validateRequest(loginSchema), 
  login
);

// Получение профиля
router.get('/profile', 
  authMiddleware, 
  getProfile
);

// Изменение пароля
router.put('/change-password', 
  authMiddleware,
  validateRequest(changePasswordSchema), 
  changePassword
);

// Выход
router.post('/logout', 
  authMiddleware, 
  logout
);

module.exports = router;
