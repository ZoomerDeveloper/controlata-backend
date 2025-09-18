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
const warehouseRoutes = require('./routes/warehouse');
const corsProxyRoutes = require('./routes/cors-proxy');

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

// CORS настройки - оптимизированы для Railway с кастомным доменом
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'https://admin-art24.online',
  'https://www.admin-art24.online',
  'https://art24.me',
  'https://www.art24.me'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (например, мобильные приложения, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin не разрешен:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  maxAge: 600, // 10 минут кеширования preflight
  optionsSuccessStatus: 204 // Правильный статус для preflight
};

app.use(cors(corsOptions));

// Явный обработчик OPTIONS для всех путей (важно для Railway + кастомный домен)
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  
  console.log('🔧 OPTIONS запрос:', {
    origin,
    path: req.path,
    method: req.method
  });
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Max-Age', '600');
    console.log('✅ OPTIONS: CORS заголовки установлены для', origin);
  } else {
    console.log('❌ OPTIONS: Origin не разрешен:', origin);
  }
  
  res.sendStatus(204);
});

// Дополнительный CORS middleware для гарантии (только для логирования)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  console.log('🔧 CORS Middleware:', {
    method: req.method,
    origin,
    path: req.path,
    userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
    referer: req.headers.referer
  });
  
  // Для основных запросов (не OPTIONS) - CORS уже обработан выше
  if (req.method !== 'OPTIONS') {
    console.log('🌐 Основной запрос от origin:', origin);
  }

  next();
});

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
    cors: {
      origin: req.headers.origin,
      allowed: true
    },
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
      '/api/dashboard',
      '/api/warehouse',
      '/cors-proxy'
    ]
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  const origin = req.headers.origin;
  const isAllowed = allowedOrigins.includes(origin);
  
  res.json({
    message: isAllowed ? 'CORS тест успешен!' : 'CORS тест неудачен!',
    origin,
    allowed: isAllowed,
    timestamp: new Date().toISOString(),
    allowedOrigins,
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
    }
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
app.use('/api/warehouse', authMiddleware, warehouseRoutes);

// CORS Proxy для обхода ограничений браузера
app.use('/cors-proxy', corsProxyRoutes);

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

// Принудительная версия для обновления CORS
const CORS_VERSION = 'v4.0.0'; // Updated version for Railway
console.log(`🚀 Запуск сервера с CORS ${CORS_VERSION}`);
console.log(`🔧 CORS Proxy доступен по адресу: /cors-proxy`);
console.log(`🌐 Разрешенные домены: localhost:3000, localhost:3001, admin-art24.online, art24.me`);

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📊 Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
