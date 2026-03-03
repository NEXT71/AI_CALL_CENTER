const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { protect, authorize, checkTrialExpiration } = require('../middleware/auth');
const { checkUsageLimits } = require('../middleware/usageLimits');
const { validateCallUpload, handleValidationErrors, validateObjectId } = require('../middleware/validation');
const { uploadLimiter } = require('../middleware/rateLimiter');

// All routes are protected and check trial expiration
router.use(protect);
router.use(checkTrialExpiration);

// Upload call with rate limiting and usage limits (minute-based + concurrency)
router.post(
  '/upload',
  uploadLimiter,
  checkUsageLimits, // Check minute limits, concurrency, and subscription validity
  authorize('Admin', 'User'),
  callController.uploadCall
);

// Get all calls
router.get('/', callController.getCalls);

// Get single call
router.get('/:id', validateObjectId('id'), handleValidationErrors, callController.getCallById);

// Get call audio
router.get('/:id/audio', validateObjectId('id'), handleValidationErrors, callController.getCallAudio);

// Trim call audio
router.post('/:id/trim', validateObjectId('id'), handleValidationErrors, callController.trimCallAudio);

// Delete call
router.delete(
  '/:id',
  authorize('Admin'),
  validateObjectId('id'),
  handleValidationErrors,
  callController.deleteCall
);

module.exports = router;
