const express = require('express');
const router = express.Router();

// Заглушка для роутов расходов
router.get('/', (req, res) => {
  res.json({ message: 'Expenses routes - в разработке' });
});

module.exports = router;
