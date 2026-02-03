const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Middleware to check if user's subscription is valid and active
 * Enforces subscription expiration and status
 */
exports.checkSubscriptionValidity = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const subscription = user.subscription;
    const now = new Date();

    // Free plan always valid
    if (subscription.status === 'free' || subscription.plan === 'free') {
      return next();
    }

    // Check if subscription expired
    if (subscription.currentPeriodEnd && now > new Date(subscription.currentPeriodEnd)) {
      // Auto-downgrade to free if expired
      if (subscription.status === 'active') {
        logger.warn('Subscription expired, auto-downgrading to free', {
          userId: user._id,
          plan: subscription.plan,
          expiredOn: subscription.currentPeriodEnd,
        });

        user.subscription.status = 'expired';
        user.subscription.plan = 'free';
        await user.save();

        return res.status(402).json({
          success: false,
          message: 'Your subscription has expired. Please renew to continue using premium features.',
          subscriptionExpired: true,
          expiredOn: subscription.currentPeriodEnd,
        });
      }
    }

    // Check trial expiration
    if (subscription.status === 'trial' && subscription.trialEndsAt) {
      if (now > new Date(subscription.trialEndsAt)) {
        logger.warn('Trial expired, downgrading to free', {
          userId: user._id,
          trialEndedOn: subscription.trialEndsAt,
        });

        user.subscription.status = 'expired';
        user.subscription.plan = 'free';
        await user.save();

        return res.status(402).json({
          success: false,
          message: 'Your trial has expired. Please upgrade to a paid plan to continue.',
          trialExpired: true,
          expiredOn: subscription.trialEndsAt,
        });
      }
    }

    // Check if subscription is in invalid state
    if (['expired', 'cancelled'].includes(subscription.status)) {
      return res.status(402).json({
        success: false,
        message: `Your subscription is ${subscription.status}. Please renew to continue.`,
        subscriptionStatus: subscription.status,
      });
    }

    // Subscription is valid
    next();
  } catch (error) {
    logger.error('Error checking subscription validity:', error);
    // Don't block on error, just log and continue
    next();
  }
};

/**
 * Check subscription validity and update plan limits in request
 */
exports.enforceSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return next();
    }

    const subscription = user.subscription;
    const now = new Date();

    // Auto-downgrade expired subscriptions
    if (subscription.status === 'active' && subscription.currentPeriodEnd) {
      if (now > new Date(subscription.currentPeriodEnd)) {
        user.subscription.status = 'expired';
        user.subscription.plan = 'free';
        await user.save();
        
        // Update req.user to reflect new plan
        req.user.subscription = user.subscription;
      }
    }

    // Auto-downgrade expired trials
    if (subscription.status === 'trial' && subscription.trialEndsAt) {
      if (now > new Date(subscription.trialEndsAt)) {
        user.subscription.status = 'expired';
        user.subscription.plan = 'free';
        await user.save();
        
        req.user.subscription = user.subscription;
      }
    }

    next();
  } catch (error) {
    logger.error('Error enforcing subscription:', error);
    next();
  }
};
