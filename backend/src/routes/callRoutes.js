const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { protect, authorize } = require('../middleware/auth');
const { validateCallUpload, handleValidationErrors, validateObjectId } = require('../middleware/validation');
const { uploadLimiter } = require('../middleware/rateLimiter');

// All routes are protected
router.use(protect);

// Upload call with rate limiting
router.post(
  '/upload',
  uploadLimiter,
  authorize('Admin', 'Manager', 'QA'),
  callController.uploadCall
);

// Get all calls
router.get('/', callController.getCalls);

// Get single call
router.get('/:id', validateObjectId('id'), handleValidationErrors, callController.getCallById);

// Get call audio
router.get('/:id/audio', validateObjectId('id'), handleValidationErrors, callController.getCallAudio);

// Delete call
router.delete(
  '/:id',
  authorize('Admin', 'Manager'),
  validateObjectId('id'),
  handleValidationErrors,
  callController.deleteCall
);

module.exports = router;
