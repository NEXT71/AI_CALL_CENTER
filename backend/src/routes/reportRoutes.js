const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId, handleValidationErrors } = require('../middleware/validation');

// All routes are protected
router.use(protect);

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
  authorize('Admin', 'Manager', 'QA'),
  reportController.getAnalyticsSummary
);

// Sales-specific reports
router.get(
  '/sales/summary',
  authorize('Admin', 'Manager', 'QA'),
  reportController.getSalesSummary
);

router.get(
  '/sales/by-agent',
  authorize('Admin', 'Manager', 'QA'),
  reportController.getSalesByAgent
);

router.get(
  '/sales/by-product',
  authorize('Admin', 'Manager', 'QA'),
  reportController.getSalesByProduct
);

router.get(
  '/sales/best-calls',
  authorize('Admin', 'Manager', 'QA'),
  reportController.getBestSaleCalls
);

module.exports = router;
