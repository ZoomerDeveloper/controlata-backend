const express = require('express');
const router = express.Router();

// Заглушка для роутов заказов
router.get('/', (req, res) => {
  res.json({ message: 'Orders routes - в разработке' });
});

module.exports = router;
