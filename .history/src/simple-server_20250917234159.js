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

// Materials API (заглушка)
app.get('/api/materials', (req, res) => {
  res.json({
    data: [
      // Холсты
      {
        id: '1',
        name: 'Холст 30x40 см',
        description: 'Холст для картин по номерам 30x40 см',
        unit: 'шт',
        category: 'CANVAS',
        isActive: true,
        pictureSizeId: '1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '2',
        name: 'Холст 40x50 см',
        description: 'Холст для картин по номерам 40x50 см',
        unit: 'шт',
        category: 'CANVAS',
        isActive: true,
        pictureSizeId: '2',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '3',
        name: 'Холст 50x70 см',
        description: 'Холст для картин по номерам 50x70 см',
        unit: 'шт',
        category: 'CANVAS',
        isActive: true,
        pictureSizeId: '3',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      // Краски
      {
        id: '4',
        name: 'Краска красная 20мл',
        description: 'Акриловая краска красного цвета',
        unit: 'мл',
        category: 'PAINT',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '5',
        name: 'Краска синяя 20мл',
        description: 'Акриловая краска синего цвета',
        unit: 'мл',
        category: 'PAINT',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '6',
        name: 'Краска желтая 20мл',
        description: 'Акриловая краска желтого цвета',
        unit: 'мл',
        category: 'PAINT',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '7',
        name: 'Краска зеленая 20мл',
        description: 'Акриловая краска зеленого цвета',
        unit: 'мл',
        category: 'PAINT',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '8',
        name: 'Краска черная 20мл',
        description: 'Акриловая краска черного цвета',
        unit: 'мл',
        category: 'PAINT',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '9',
        name: 'Краска белая 20мл',
        description: 'Акриловая краска белого цвета',
        unit: 'мл',
        category: 'PAINT',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      // Кисти
      {
        id: '10',
        name: 'Кисть №1',
        description: 'Кисть для детальной прорисовки №1',
        unit: 'шт',
        category: 'BRUSH',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '11',
        name: 'Кисть №3',
        description: 'Кисть для детальной прорисовки №3',
        unit: 'шт',
        category: 'BRUSH',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '12',
        name: 'Кисть №5',
        description: 'Кисть для заливки №5',
        unit: 'шт',
        category: 'BRUSH',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '13',
        name: 'Кисть №8',
        description: 'Кисть для заливки №8',
        unit: 'шт',
        category: 'BRUSH',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      // Рамки
      {
        id: '14',
        name: 'Рамка 30x40 см',
        description: 'Деревянная рамка 30x40 см',
        unit: 'шт',
        category: 'FRAME',
        isActive: true,
        pictureSizeId: '1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '15',
        name: 'Рамка 40x50 см',
        description: 'Деревянная рамка 40x50 см',
        unit: 'шт',
        category: 'FRAME',
        isActive: true,
        pictureSizeId: '2',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '16',
        name: 'Рамка 50x70 см',
        description: 'Деревянная рамка 50x70 см',
        unit: 'шт',
        category: 'FRAME',
        isActive: true,
        pictureSizeId: '3',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      // Номера
      {
        id: '17',
        name: 'Номера 1-50',
        description: 'Наклейки с номерами 1-50',
        unit: 'комплект',
        category: 'NUMBER',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '18',
        name: 'Номера 51-100',
        description: 'Наклейки с номерами 51-100',
        unit: 'комплект',
        category: 'NUMBER',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      // Упаковка
      {
        id: '19',
        name: 'Пакет для картины',
        description: 'Полиэтиленовый пакет для упаковки картины',
        unit: 'шт',
        category: 'PACKAGING',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '20',
        name: 'Картонная коробка',
        description: 'Картонная коробка для доставки картины',
        unit: 'шт',
        category: 'PACKAGING',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 20,
      totalPages: 2
    }
  });
});

app.get('/api/materials/:id', (req, res) => {
  const material = {
    id: req.params.id,
    name: 'Холст 30x40',
    description: 'Холст для картин по номерам',
    unit: 'шт',
    category: 'CANVAS',
    isActive: true,
    pictureSizeId: '1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };
  res.json({ material });
});

app.post('/api/materials', (req, res) => {
  const newMaterial = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  res.status(201).json({ data: newMaterial });
});

app.put('/api/materials/:id', (req, res) => {
  const updatedMaterial = {
    id: req.params.id,
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json({ data: updatedMaterial });
});

app.delete('/api/materials/:id', (req, res) => {
  res.status(204).send();
});

// Material Purchases API (закупки с ценами)
app.get('/api/materials/purchases/all', (req, res) => {
  res.json({
    data: [
      {
        id: '1',
        materialId: '1',
        quantity: 50,
        unitPrice: 2.50,
        totalPrice: 125.00,
        supplier: 'Художественный магазин "Кисть"',
        purchaseDate: '2024-01-15T00:00:00.000Z',
        notes: 'Закупка холстов на месяц',
        material: {
          id: '1',
          name: 'Холст 30x40 см',
          unit: 'шт'
        },
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z'
      },
      {
        id: '2',
        materialId: '4',
        quantity: 100,
        unitPrice: 0.80,
        totalPrice: 80.00,
        supplier: 'Краски и кисти ООО',
        purchaseDate: '2024-01-20T00:00:00.000Z',
        notes: 'Краски красного цвета',
        material: {
          id: '4',
          name: 'Краска красная 20мл',
          unit: 'мл'
        },
        createdAt: '2024-01-20T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z'
      },
      {
        id: '3',
        materialId: '10',
        quantity: 20,
        unitPrice: 3.50,
        totalPrice: 70.00,
        supplier: 'Инструменты для художников',
        purchaseDate: '2024-02-01T00:00:00.000Z',
        notes: 'Кисти для детальной работы',
        material: {
          id: '10',
          name: 'Кисть №1',
          unit: 'шт'
        },
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z'
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 3,
      totalPages: 1
    }
  });
});

app.post('/api/materials/:materialId/purchases', (req, res) => {
  const newPurchase = {
    id: Date.now().toString(),
    materialId: req.params.materialId,
    ...req.body,
    totalPrice: req.body.quantity * req.body.unitPrice,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  res.status(201).json({ data: newPurchase });
});

// Stock API (остатки на складе)
app.get('/api/materials/low-stock/list', (req, res) => {
  res.json({
    data: [
      {
        id: '1',
        materialId: '4',
        quantity: 5,
        minLevel: 20,
        lastUpdated: '2024-02-15T00:00:00.000Z',
        material: {
          id: '4',
          name: 'Краска красная 20мл',
          unit: 'мл'
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-02-15T00:00:00.000Z'
      },
      {
        id: '2',
        materialId: '5',
        quantity: 8,
        minLevel: 15,
        lastUpdated: '2024-02-15T00:00:00.000Z',
        material: {
          id: '5',
          name: 'Краска синяя 20мл',
          unit: 'мл'
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-02-15T00:00:00.000Z'
      }
    ]
  });
});

// Picture Sizes API (заглушка)
app.get('/api/picture-sizes', (req, res) => {
  res.json({
    data: [
      {
        id: '1',
        name: '30x40 см',
        width: 30,
        height: 40,
        description: 'Стандартный размер',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '2',
        name: '40x50 см',
        width: 40,
        height: 50,
        description: 'Большой размер',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    }
  });
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
    analytics: {
      lowStockMaterials: [
        { id: '1', name: 'Холст 30x40', currentStock: 5, minLevel: 10, unit: 'шт' },
        { id: '2', name: 'Краска красная', currentStock: 2, minLevel: 5, unit: 'мл' }
      ],
      topCustomers: [
        { customerName: 'Иван Петров', _sum: { totalPrice: 600 }, _count: { id: 5 } },
        { customerName: 'Мария Сидорова', _sum: { totalPrice: 255 }, _count: { id: 3 } },
        { customerName: 'Алексей Козлов', _sum: { totalPrice: 400 }, _count: { id: 2 } }
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
