const express = require('express');
const router = express.Router();

// Заглушка для роутов пользователей
router.get('/', (req, res) => {
  res.json({ message: 'Users routes - в разработке' });
});

module.exports = router;
