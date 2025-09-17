const express = require('express');
const router = express.Router();

// Заглушка для роутов доходов
router.get('/', (req, res) => {
  res.json({ message: 'Incomes routes - в разработке' });
});

module.exports = router;
