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
const { authMiddleware } = require('../middleware/auth');

// Регистрация
router.post('/register', 
  validateRequest(registerSchema), 
  authController.register
);

// Вход
router.post('/login', 
  validateRequest(loginSchema), 
  authController.login
);

// Получение профиля
router.get('/profile', 
  authMiddleware, 
  authController.getProfile
);

// Изменение пароля
router.put('/change-password', 
  authMiddleware,
  validateRequest(changePasswordSchema), 
  authController.changePassword
);

// Выход
router.post('/logout', 
  authMiddleware, 
  authController.logout
);

module.exports = router;
