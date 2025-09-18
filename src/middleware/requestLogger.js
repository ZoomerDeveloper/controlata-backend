const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Логируем входящий запрос
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Перехватываем ответ
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Логируем ответ
    logger.info('Response sent', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: data ? data.length : 0
    });

    // Если ошибка, логируем детали
    if (res.statusCode >= 400) {
      logger.error('Error response', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        error: data,
        duration: `${duration}ms`
      });
    }

    originalSend.call(this, data);
  };

  next();
};

module.exports = requestLogger;

