const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/plans', subscriptionController.getPlans);

// Protected routes
router.use(protect);

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Protected test endpoint working' });
});

module.exports = router;
