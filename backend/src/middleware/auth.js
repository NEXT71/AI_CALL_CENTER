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
    const now = new Date();

    // Allow free tier users unlimited access with limited features
    if (user.subscription?.status === 'free') {
      return next();
    }

    // Check for cancelled subscriptions that have passed their period end
    if (user.subscription?.status === 'cancelled') {
      const periodEnd = new Date(user.subscription.currentPeriodEnd);
      if (now > periodEnd) {
        // Downgrade to free tier
        user.subscription.status = 'free';
        user.subscription.plan = 'free';
        user.subscription.cancelledAt = null;
        await user.save();

        return res.status(402).json({
          success: false,
          message: 'Your subscription has been cancelled and access period has ended. You have been moved to the free plan.',
          subscriptionExpired: true,
          downgradedToFree: true,
        });
      }
      // If period hasn't ended yet, allow access
      return next();
    }

    // Check for active paid subscriptions that have expired
    if (user.subscription?.status === 'active' && user.subscription?.plan !== 'free') {
      const periodEnd = new Date(user.subscription.currentPeriodEnd);
      if (now > periodEnd) {
        // Downgrade to free tier
        user.subscription.status = 'free';
        user.subscription.plan = 'free';
        await user.save();

        return res.status(402).json({
          success: false,
          message: 'Your paid subscription has expired. You have been moved to the free plan with limited features.',
          subscriptionExpired: true,
          downgradedToFree: true,
        });
      }
      // Active and not expired
      return next();
    }

    // Allow free tier active subscriptions
    if (user.subscription?.status === 'active' && user.subscription?.plan === 'free') {
      return next();
    }

    // Check if trial has expired
    if (user.subscription?.status === 'trial') {
      const trialEndsAt = new Date(user.subscription.trialEndsAt);

      if (now > trialEndsAt) {
        // Downgrade to free tier instead of blocking access
        user.subscription.status = 'free';
        user.subscription.plan = 'free';
        await user.save();

        return res.status(402).json({
          success: false,
          message: 'Your trial has ended. You have been moved to the free plan with limited features.',
          trialExpired: true,
          downgradedToFree: true,
        });
      }
      // Trial still active
      return next();
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
