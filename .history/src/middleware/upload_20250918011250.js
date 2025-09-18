const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем папку для загрузки, если она не существует
const uploadDir = path.join(__dirname, '../../uploads/pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `picture-${uniqueSuffix}${ext}`);
  }
});

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
  // Разрешаем только изображения
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Только изображения разрешены!'), false);
  }
};

// Настройка multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB максимум
  }
});

// Middleware для загрузки одного изображения
const uploadSingle = upload.single('image');

// Middleware для обработки ошибок загрузки
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Файл слишком большой. Максимальный размер: 10MB' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Неожиданное поле файла' });
    }
  }
  
  if (err.message === 'Только изображения разрешены!') {
    return res.status(400).json({ error: 'Только изображения разрешены!' });
  }
  
  next(err);
};

module.exports = {
  uploadSingle,
  handleUploadError
};
