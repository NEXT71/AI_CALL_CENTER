const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/plans', subscriptionController.getPlans);

// Protected routes
router.use(protect);

router.post('/create-checkout-session', subscriptionController.createCheckoutSession);
router.post('/create-portal-session', subscriptionController.createPortalSession);
router.get('/current', subscriptionController.getCurrentSubscription);
router.post('/cancel', subscriptionController.cancelSubscription);
router.post('/reactivate', subscriptionController.reactivateSubscription);
router.get('/invoices', subscriptionController.getInvoices);

module.exports = router;
