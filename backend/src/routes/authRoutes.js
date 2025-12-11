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

// Email verification
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', protect, authController.resendVerification);

// Password reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

module.exports = router;
