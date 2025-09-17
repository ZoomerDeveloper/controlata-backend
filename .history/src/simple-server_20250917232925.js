const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS настройки
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://controlata.railway.app',
      'https://controlata-production.up.railway.app',
      'https://controlata.com',
      'https://www.controlata.com',
      'https://api.art24.me'
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Слишком много запросов с этого IP, попробуйте позже.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test API route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API работает!',
    timestamp: new Date().toISOString(),
    routes: [
      '/api/auth',
      '/api/users', 
      '/api/picture-sizes',
      '/api/materials',
      '/api/orders',
      '/api/pictures',
      '/api/incomes',
      '/api/expenses',
      '/api/reports',
      '/api/dashboard'
    ]
  });
});

// Simple auth routes (без базы данных)
app.get('/api/auth', (req, res) => {
  res.json({
    message: 'Auth API работает!',
    endpoints: [
      'POST /api/auth/login',
      'GET /api/auth/profile',
      'POST /api/auth/register',
      'PUT /api/auth/change-password',
      'POST /api/auth/logout'
    ]
  });
});

app.get('/api/auth/login', (req, res) => {
  res.status(405).json({ 
    error: 'Метод не разрешен',
    message: 'Используйте POST запрос для входа',
    method: 'POST',
    endpoint: '/api/auth/login',
    body: {
      email: 'string',
      password: 'string'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@controlata.com' && password === 'admin123') {
    res.json({
      user: {
        id: '1',
        email: 'admin@controlata.com',
        name: 'Администратор',
        role: 'ADMIN',
        isActive: true
      },
      token: 'fake-jwt-token-for-testing'
    });
  } else {
    res.status(401).json({ error: 'Неверные учетные данные' });
  }
});

app.get('/api/auth/profile', (req, res) => {
  res.json({
    user: {
      id: '1',
      email: 'admin@controlata.com',
      name: 'Администратор',
      role: 'ADMIN',
      isActive: true
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  res.status(501).json({ error: 'Регистрация временно недоступна' });
});

app.put('/api/auth/change-password', (req, res) => {
  res.status(501).json({ error: 'Смена пароля временно недоступна' });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Выход выполнен успешно' });
});

// Dashboard API (заглушка)
app.get('/api/dashboard', (req, res) => {
  res.json({
    period: {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      type: 'year'
    },
    orders: {
      total: 45,
      revenue: 15000,
      byStatus: [
        { status: 'COMPLETED', _count: { id: 38 }, _sum: { totalPrice: 12000 } },
        { status: 'IN_PROGRESS', _count: { id: 5 }, _sum: { totalPrice: 2500 } },
        { status: 'PENDING', _count: { id: 2 }, _sum: { totalPrice: 500 } }
      ]
    },
    pictures: {
      total: 45,
      revenue: 15000,
      cost: 8500,
      profit: 6500,
      byType: [
        { type: 'READY_MADE', _count: { id: 30 }, _sum: { price: 10000, costPrice: 5000 } },
        { type: 'CUSTOM_PHOTO', _count: { id: 15 }, _sum: { price: 5000, costPrice: 3500 } }
      ]
    },
    finances: {
      revenue: 15000,
      expenses: 8500,
      profit: 6500,
      profitMargin: 43.3
    },
    materials: {
      lowStock: [
        { id: '1', name: 'Холст 30x40', currentStock: 5, minLevel: 10 },
        { id: '2', name: 'Краска красная', currentStock: 2, minLevel: 5 }
      ]
    },
    recentOrders: [
      { id: '1', customerName: 'Иван Петров', status: 'COMPLETED', totalPrice: 120 },
      { id: '2', customerName: 'Мария Сидорова', status: 'IN_PROGRESS', totalPrice: 85 },
      { id: '3', customerName: 'Алексей Козлов', status: 'PENDING', totalPrice: 200 }
    ],
    topCustomers: [
      { name: 'Иван Петров', totalOrders: 5, totalSpent: 600 },
      { name: 'Мария Сидорова', totalOrders: 3, totalSpent: 255 },
      { name: 'Алексей Козлов', totalOrders: 2, totalSpent: 400 }
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Простой сервер запущен на порту ${PORT}`);
  console.log(`📊 Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API test: http://localhost:${PORT}/api`);
});

module.exports = app;
