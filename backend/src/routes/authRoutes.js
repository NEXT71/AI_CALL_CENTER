const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} = require('../middleware/validation');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Public routes with rate limiting
// NOTE: Registration should be protected in production (admin-only)
// For initial setup, leave unprotected. After creating admin, protect this route.
router.post(
  '/register',
  registerLimiter,
  validateRegister,
  handleValidationErrors,
  authController.register
);

// To enable admin-only registration, uncomment below and comment above:
// router.post(
//   '/register',
//   registerLimiter,
//   protect,
//   authorize('Admin'),
//   validateRegister,
//   handleValidationErrors,
//   authController.register
// );

router.post(
  '/login',
  authLimiter,
  validateLogin,
  handleValidationErrors,
  authController.login
);

router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/me', protect, authController.getMe);

module.exports = router;
