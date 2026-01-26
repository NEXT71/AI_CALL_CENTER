const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// Public routes
router.get('/plans', subscriptionController.getPlans);

// Test protected route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Test endpoint working' });
});

module.exports = router;
