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

// Create sales record (Admin & User)
router.post(
  '/',
  authorize('Admin', 'User'),
  [
    body('recordType').optional().isIn(['agent', 'office']).withMessage('Invalid record type'),
    body('agentId')
      .if(body('recordType').equals('agent'))
      .isMongoId().withMessage('Invalid agent ID'),
    body('campaign').trim().notEmpty().withMessage('Campaign is required'),
    body('salesDate').isISO8601().withMessage('Valid date is required'),
    // Agent-specific fields
    body('totalCalls')
      .if(body('recordType').equals('agent'))
      .isInt({ min: 0 }).withMessage('Total calls must be a positive number'),
    body('successfulSales')
      .if(body('recordType').equals('agent'))
      .isInt({ min: 0 }).withMessage('Successful sales must be a positive number'),
    body('failedSales')
      .if(body('recordType').equals('agent'))
      .isInt({ min: 0 }).withMessage('Failed sales must be a positive number'),
    // Office-specific fields
    body('officeRevenue')
      .if(body('recordType').equals('office'))
      .optional()
      .isFloat({ min: 0 }).withMessage('Office revenue must be a positive number'),
    body('officeTargets')
      .if(body('recordType').equals('office'))
      .optional()
      .isInt({ min: 0 }).withMessage('Office targets must be a positive number'),
  ],
  handleValidationErrors,
  salesController.createSalesRecord
);

// Get all sales records (with pagination and filters)
router.get('/', salesController.getSalesRecords);

// Get sales analytics (all authenticated users)
router.get('/analytics', salesController.getSalesAnalytics);

// Export sales data to CSV
router.get('/export', authorize('Admin', 'User'), salesController.exportSalesData);

// Get single sales record by ID
router.get('/:id', validateObjectId('id'), handleValidationErrors, salesController.getSalesRecordById);

// Update sales record (User can only update own, Admin can update all)
router.put(
  '/:id',
  authorize('Admin', 'User'),
  validateObjectId('id'),
  handleValidationErrors,
  salesController.updateSalesRecord
);

// Add QA review to sales record (Admin & User)
router.post(
  '/:id/review',
  authorize('Admin', 'User'),
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
