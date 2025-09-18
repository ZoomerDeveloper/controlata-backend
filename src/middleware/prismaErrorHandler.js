const logger = require('../utils/logger');

const prismaErrorHandler = (error, req, res, next) => {
  logger.error('Prisma error occurred', {
    error: error.message,
    code: error.code,
    meta: error.meta,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  // Обрабатываем разные типы ошибок Prisma
  if (error.code === 'P2002') {
    return res.status(400).json({
      error: 'Ошибка уникальности',
      details: 'Запись с такими данными уже существует',
      field: error.meta?.target
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      error: 'Запись не найдена',
      details: 'Запрашиваемая запись не существует'
    });
  }

  if (error.code === 'P2003') {
    return res.status(400).json({
      error: 'Ошибка внешнего ключа',
      details: 'Нарушение связи между таблицами'
    });
  }

  if (error.code === 'P1010') {
    return res.status(500).json({
      error: 'Ошибка доступа к базе данных',
      details: 'Нет доступа к базе данных. Проверьте подключение.'
    });
  }

  // Общая ошибка Prisma
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(500).json({
      error: 'Ошибка базы данных',
      details: error.message,
      code: error.code
    });
  }

  // Ошибка подключения к Prisma
  if (error.name === 'PrismaClientInitializationError') {
    return res.status(500).json({
      error: 'Ошибка инициализации базы данных',
      details: 'Не удалось подключиться к базе данных'
    });
  }

  // Ошибка валидации Prisma
  if (error.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      error: 'Ошибка валидации данных',
      details: error.message
    });
  }

  next(error);
};

module.exports = prismaErrorHandler;

