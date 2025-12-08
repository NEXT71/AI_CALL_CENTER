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

module.exports = router;
