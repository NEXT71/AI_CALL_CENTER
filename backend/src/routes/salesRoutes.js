const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { protect, authorize, checkTrialExpiration } = require('../middleware/auth');
const { validateObjectId, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

// All routes require authentication
router.use(protect);
router.use(checkTrialExpiration);

// Get campaigns list (all authenticated users)
router.get('/campaigns', salesController.getCampaigns);

// Create sales record (QA & Admin only)
router.post(
  '/',
  authorize('Admin', 'QA'),
  [
    body('agentId').isMongoId().withMessage('Invalid agent ID'),
    body('campaign').trim().notEmpty().withMessage('Campaign is required'),
    body('salesDate').isISO8601().withMessage('Valid date is required'),
    body('totalCalls').isInt({ min: 0 }).withMessage('Total calls must be a positive number'),
    body('successfulSales').isInt({ min: 0 }).withMessage('Successful sales must be a positive number'),
    body('failedSales').isInt({ min: 0 }).withMessage('Failed sales must be a positive number'),
    body('warmTransfers').optional().isInt({ min: 0 }).withMessage('Warm transfers must be a positive number'),
    body('callbacksScheduled').optional().isInt({ min: 0 }).withMessage('Callbacks must be a positive number'),
  ],
  handleValidationErrors,
  salesController.createSalesRecord
);

// Get all sales records (with pagination and filters)
router.get('/', salesController.getSalesRecords);

// Get sales analytics (all authenticated users)
router.get('/analytics', salesController.getSalesAnalytics);

// Export sales data to CSV
router.get('/export', authorize('Admin', 'Manager', 'QA'), salesController.exportSalesData);

// Get single sales record by ID
router.get('/:id', validateObjectId('id'), handleValidationErrors, salesController.getSalesRecordById);

// Update sales record (QA can only update own, Admin can update all)
router.put(
  '/:id',
  authorize('Admin', 'QA'),
  validateObjectId('id'),
  handleValidationErrors,
  salesController.updateSalesRecord
);

// Add QA review to sales record (QA & Admin only)
router.post(
  '/:id/review',
  authorize('Admin', 'QA'),
  validateObjectId('id'),
  [
    body('verified').isBoolean().withMessage('Verified must be true or false'),
    body('comments').optional().trim(),
  ],
  handleValidationErrors,
  salesController.addQAReview
);

// Delete sales record (Admin only)
router.delete(
  '/:id',
  authorize('Admin'),
  validateObjectId('id'),
  handleValidationErrors,
  salesController.deleteSalesRecord
);

module.exports = router;
