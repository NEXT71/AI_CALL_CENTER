const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

/**
 * Verify JWT token and attach user to request
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies first (preferred), then headers (fallback for API clients)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

/**
 * Check if user's trial has expired
 */
exports.checkTrialExpiration = async (req, res, next) => {
  try {
    const user = req.user;

    // Allow free tier users unlimited access with limited features
    if (user.subscription?.status === 'free') {
      return next();
    }

    // Skip check if user has active subscription
    if (user.subscription?.status === 'active') {
      return next();
    }

    // Check if trial has expired
    if (user.subscription?.status === 'trial') {
      const now = new Date();
      const trialEndsAt = new Date(user.subscription.trialEndsAt);

      if (now > trialEndsAt) {
        // Downgrade to free tier instead of blocking access
        user.subscription.status = 'free';
        user.subscription.plan = 'free';
        await user.save();

        return res.status(200).json({
          success: true,
          message: 'Your trial has ended. You have been moved to the free plan with limited features.',
          trialExpired: true,
          downgradedToFree: true,
        });
      }
    }

    // If trial is already expired, move to free tier
    if (user.subscription?.status === 'expired') {
      user.subscription.status = 'free';
      user.subscription.plan = 'free';
      await user.save();
      return next();
    }

    next();
  } catch (error) {
    next(error);
  }
};
