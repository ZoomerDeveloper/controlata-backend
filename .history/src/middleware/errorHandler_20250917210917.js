const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Нарушение уникальности',
      details: 'Запись с такими данными уже существует'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Запись не найдена',
      details: 'Запрашиваемая запись не существует'
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      error: 'Ошибка внешнего ключа',
      details: 'Связанная запись не найдена'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: err.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Недействительный токен'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Токен истек'
    });
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Файл слишком большой',
      details: `Максимальный размер файла: ${process.env.MAX_FILE_SIZE || '5MB'}`
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
