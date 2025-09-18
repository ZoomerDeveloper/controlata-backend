const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const pictureSizeRoutes = require('./routes/pictureSizes');
const materialRoutes = require('./routes/materials');
const orderRoutes = require('./routes/orders');
const pictureRoutes = require('./routes/pictures');
const incomeRoutes = require('./routes/incomes');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const uploadRoutes = require('./routes/upload');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const prismaErrorHandler = require('./middleware/prismaErrorHandler');

const app = express();

// Инициализируем Prisma асинхронно
let prisma = {
  user: { findUnique: () => Promise.resolve(null) },
  $disconnect: () => Promise.resolve()
};

// Пытаемся подключиться к Prisma в фоне
(async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    console.log('✅ Prisma подключен успешно');
  } catch (error) {
    console.error('❌ Ошибка подключения Prisma:', error.message);
    console.log('⚠️ Продолжаем работу без базы данных');
  }
})();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Отключаем CSP для API
  crossOriginEmbedderPolicy: false
}));

// CORS настройки
const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (мобильные приложения, Postman)
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
    
    console.log('CORS Origin check:', { origin, allowedOrigins });
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
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
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Слишком много запросов с этого IP, попробуйте позже.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Request logging
app.use(requestLogger);

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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/picture-sizes', authMiddleware, pictureSizeRoutes);
app.use('/api/materials', authMiddleware, materialRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/pictures', authMiddleware, pictureRoutes);
app.use('/api/incomes', authMiddleware, incomeRoutes);
app.use('/api/expenses', authMiddleware, expenseRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Маршрут не найден',
    path: req.originalUrl 
  });
});

// Error handling middleware
app.use(prismaErrorHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Получен SIGINT. Закрытие сервера...');
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Ошибка при отключении Prisma:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Получен SIGTERM. Закрытие сервера...');
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Ошибка при отключении Prisma:', error.message);
  }
  process.exit(0);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📊 Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
