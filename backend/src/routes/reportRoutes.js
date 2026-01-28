const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize, checkTrialExpiration } = require('../middleware/auth');
const { validateObjectId, handleValidationErrors } = require('../middleware/validation');

// All routes are protected and check trial expiration
router.use(protect);
router.use(checkTrialExpiration);

// Get call report
router.get(
  '/:callId',
  validateObjectId('callId'),
  handleValidationErrors,
  reportController.getCallReport
);

// Get analytics summary
router.get(
  '/analytics/summary',
  authorize('Admin', 'User'),
  reportController.getAnalyticsSummary
);

// Sales-specific reports
router.get(
  '/sales/summary',
  authorize('Admin', 'User'),
  reportController.getSalesSummary
);

router.get(
  '/sales/by-agent',
  authorize('Admin', 'User'),
  reportController.getSalesByAgent
);

router.get(
  '/sales/by-product',
  authorize('Admin', 'User'),
  reportController.getSalesByProduct
);

router.get(
  '/sales/best-calls',
  authorize('Admin', 'User'),
  reportController.getBestSaleCalls
);

// System reports
router.get(
  '/system/summary',
  authorize('Admin'),
  reportController.getSystemSummary
);

router.get(
  '/system/user-activity',
  authorize('Admin'),
  reportController.getUserActivityReport
);

router.get(
  '/system/subscription-analytics',
  authorize('Admin'),
  reportController.getSubscriptionAnalytics
);

module.exports = router;
