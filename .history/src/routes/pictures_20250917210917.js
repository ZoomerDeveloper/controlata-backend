const express = require('express');
const router = express.Router();

// Заглушка для роутов картин
router.get('/', (req, res) => {
  res.json({ message: 'Pictures routes - в разработке' });
});

module.exports = router;
