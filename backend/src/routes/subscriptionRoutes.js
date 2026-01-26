const express = require('express');
const router = express.Router();

// Temporary simplified routes for testing
router.get('/plans', (req, res) => {
  res.json({ success: true, message: 'Plans endpoint working' });
});

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Test endpoint working' });
});

module.exports = router;
