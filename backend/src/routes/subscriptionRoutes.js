const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Admin middleware function
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

// Public routes
router.get('/plans', subscriptionController.getPlans);

// Protected routes
router.use(protect);

router.post('/create-checkout-session', subscriptionController.createCheckoutSession);
router.get('/verify-session/:sessionId', subscriptionController.verifySession);
router.post('/activate', subscriptionController.activateSubscription);
router.post('/request', subscriptionController.requestSubscription); // New: User subscription request
router.post('/create-portal-session', subscriptionController.createPortalSession);
router.get('/current', subscriptionController.getCurrentSubscription);
router.post('/cancel', subscriptionController.cancelSubscription);
router.post('/reactivate', subscriptionController.reactivateSubscription);
router.get('/invoices', subscriptionController.getInvoices);

// Admin routes (with proper middleware)
router.post('/admin-activate', requireAdmin, subscriptionController.adminActivateSubscription);
router.get('/pending-payments', requireAdmin, subscriptionController.getPendingPayments);
router.post('/admin-approve-payment/:paymentId', requireAdmin, subscriptionController.approvePayment);
router.post('/admin-reject-payment/:paymentId', requireAdmin, subscriptionController.rejectPayment);

module.exports = router;
