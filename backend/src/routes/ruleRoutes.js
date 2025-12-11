const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const { protect, authorize, checkTrialExpiration } = require('../middleware/auth');
const { validateRule, validateComplianceRule, handleValidationErrors, validateObjectId } = require('../middleware/validation');

// All routes are protected and check trial expiration
router.use(protect);
router.use(checkTrialExpiration);

// Get campaigns list
router.get('/campaigns/list', ruleController.getCampaigns);

// Create rule
router.post(
  '/',
  authorize('Admin', 'Manager'),
  validateComplianceRule,
  handleValidationErrors,
  ruleController.createRule
);

// Get all rules
router.get('/', ruleController.getRules);

// Get single rule
router.get('/:id', validateObjectId('id'), handleValidationErrors, ruleController.getRuleById);

// Update rule
router.put(
  '/:id',
  authorize('Admin', 'Manager'),
  validateObjectId('id'),
  handleValidationErrors,
  ruleController.updateRule
);

// Delete rule
router.delete(
  '/:id',
  authorize('Admin'),
  validateObjectId('id'),
  handleValidationErrors,
  ruleController.deleteRule
);

module.exports = router;
