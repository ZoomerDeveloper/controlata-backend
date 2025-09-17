const express = require('express');
const router = express.Router();

// Заглушка для роутов дашборда
router.get('/', (req, res) => {
  res.json({ message: 'Dashboard routes - в разработке' });
});

module.exports = router;
