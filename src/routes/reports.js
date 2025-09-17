const express = require('express');
const router = express.Router();

// Заглушка для роутов отчетов
router.get('/', (req, res) => {
  res.json({ message: 'Reports routes - в разработке' });
});

module.exports = router;
