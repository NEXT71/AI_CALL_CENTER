const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/plans', subscriptionController.getPlans);

// Protected routes
router.use(protect);

router.post('/create-checkout-session', subscriptionController.createCheckoutSession);
router.get('/verify-session/:sessionId', subscriptionController.verifySession);
router.post('/activate', subscriptionController.activateSubscription);
router.post('/create-portal-session', subscriptionController.createPortalSession);
router.get('/current', subscriptionController.getCurrentSubscription);
router.post('/cancel', subscriptionController.cancelSubscription);
router.post('/reactivate', subscriptionController.reactivateSubscription);
router.get('/invoices', subscriptionController.getInvoices);
// Admin routes (require admin role)
router.post('/admin-activate', (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
}, subscriptionController.adminActivateSubscription);

router.get('/pending-payments', (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
}, subscriptionController.getPendingPayments);
