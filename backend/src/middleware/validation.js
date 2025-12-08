const { body, param, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Auth validation rules
 */
exports.validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['Admin', 'Manager', 'QA', 'Agent']).withMessage('Invalid role'),
];

exports.validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Call validation rules
 */
exports.validateCallUpload = [
  body('agentId').notEmpty().withMessage('Agent ID is required'),
  body('agentName').trim().notEmpty().withMessage('Agent name is required'),
  body('campaign').trim().notEmpty().withMessage('Campaign is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('callDate').isISO8601().withMessage('Valid call date is required'),
];

/**
 * Compliance rule validation
 */
exports.validateComplianceRule = [
  body('campaign').trim().notEmpty().withMessage('Campaign is required'),
  body('ruleType').isIn(['mandatory', 'forbidden']).withMessage('Invalid rule type'),
  body('phrase').trim().notEmpty().withMessage('Phrase is required'),
  body('fuzzyTolerance').optional().isInt({ min: 0, max: 5 }).withMessage('Fuzzy tolerance must be 0-5'),
  body('weight').optional().isInt({ min: 1, max: 10 }).withMessage('Weight must be 1-10'),
];

/**
 * MongoDB ObjectId validation
 */
exports.validateObjectId = (paramName) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
];
