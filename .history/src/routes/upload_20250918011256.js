const express = require('express');
const path = require('path');
const fs = require('fs');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const auth = require('../middleware/auth');

const router = express.Router();

// Загрузка изображения картины
router.post('/picture', auth, uploadSingle, handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не предоставлен' });
    }

    // Возвращаем информацию о загруженном файле
    const fileUrl = `/uploads/pictures/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Изображение успешно загружено',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
});

// Получение изображения
router.get('/picture/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/pictures', filename);
    
    // Проверяем, существует ли файл
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    // Отправляем файл
    res.sendFile(filePath);
  } catch (error) {
    console.error('Ошибка получения файла:', error);
    res.status(500).json({ error: 'Ошибка получения файла' });
  }
});

// Удаление изображения
router.delete('/picture/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/pictures', filename);
    
    // Проверяем, существует ли файл
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    // Удаляем файл
    fs.unlinkSync(filePath);
    
    res.json({ success: true, message: 'Файл успешно удален' });
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    res.status(500).json({ error: 'Ошибка удаления файла' });
  }
});

module.exports = router;
