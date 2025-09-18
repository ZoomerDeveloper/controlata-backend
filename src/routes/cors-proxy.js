const express = require('express');
const router = express.Router();

// CORS Proxy для обхода ограничений браузера
router.all('*', (req, res) => {
  console.log('🔧 CORS Proxy запрос:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });

  // Устанавливаем CORS заголовки
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');

  // Обрабатываем OPTIONS запросы
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS запрос обработан через CORS Proxy');
    res.status(200).end();
    return;
  }

  // Для остальных запросов перенаправляем на API
  const apiUrl = `https://controlata-production.up.railway.app/api${req.path}`;
  
  console.log(`🔄 Перенаправляем на API: ${apiUrl}`);
  
  // Простое перенаправление
  res.redirect(302, apiUrl);
});

module.exports = router;
