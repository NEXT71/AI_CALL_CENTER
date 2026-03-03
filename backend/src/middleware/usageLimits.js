const Call = require('../models/Call');
const User = require('../models/User');
const logger = require('../config/logger');
const config = require('../config/config');

// Use centralized plan config from config.js
const PLAN_CONFIG = config.subscription.plans;

/**
 * Check if user has exceeded their monthly minute limit or concurrency limit
 */
exports.checkUsageLimits = async (req, res, next) => {
  try {
    const user = req.user;
    const subscription = user.subscription || {};
    const plan = subscription.plan || 'free';
    const planConfig = PLAN_CONFIG[plan];

    if (!planConfig) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan',
      });
    }

    // Check subscription validity first
    const now = new Date();
    
    // Check if subscription expired
    if (subscription.status === 'active' && subscription.currentPeriodEnd) {
      if (now > new Date(subscription.currentPeriodEnd)) {
        return res.status(402).json({
          success: false,
          message: 'Your subscription has expired. Please renew to continue.',
          subscriptionExpired: true,
        });
      }
    }

    // Check if trial expired
    if (subscription.status === 'trial' && subscription.trialEndsAt) {
      if (now > new Date(subscription.trialEndsAt)) {
        return res.status(402).json({
          success: false,
          message: 'Your trial has expired. Please upgrade to continue.',
          trialExpired: true,
        });
      }
    }

    // Check if subscription is in invalid state
    if (['expired', 'cancelled'].includes(subscription.status) && plan !== 'free') {
      return res.status(402).json({
        success: false,
        message: `Your subscription is ${subscription.status}. Please renew to continue.`,
        subscriptionStatus: subscription.status,
      });
    }

    // Check concurrency limit (number of active calls being processed)
    const activeCalls = subscription.usage?.activeCalls || 0;
    const concurrencyLimit = planConfig.limits.concurrentCalls;

    if (concurrencyLimit !== -1 && activeCalls >= concurrencyLimit) {
      return res.status(429).json({
        success: false,
        message: `You have reached your concurrency limit of ${concurrencyLimit} simultaneous calls. Please wait for current calls to complete or upgrade your plan.`,
        concurrencyExceeded: true,
        activeCalls,
        limit: concurrencyLimit,
        plan,
      });
    }

    // For free plan, check call count (no minutes)
    if (plan === 'free') {
      const callLimit = planConfig.limits.callsPerMonth;
      const callsThisMonth = subscription.usage?.callsThisMonth || 0;

      if (callsThisMonth >= callLimit) {
        return res.status(402).json({
          success: false,
          message: `You have reached your monthly limit of ${callLimit} calls. Please upgrade your plan to continue.`,
          limitExceeded: true,
          currentUsage: callsThisMonth,
          limit: callLimit,
          plan,
        });
      }
    } else {
      // For paid plans, check minutes (but allow overage with warning)
      const minutesUsed = subscription.usage?.minutesThisMonth || 0;
      const minutesIncluded = planConfig.includedMinutes;
      
      // If over limit, set flag for overage billing (but don't block)
      if (minutesUsed >= minutesIncluded) {
        logger.warn('User exceeded included minutes, applying overage rate', {
          userId: user._id,
          minutesUsed,
          minutesIncluded,
          plan,
        });
        
        req.overageApplied = true;
        req.overageRate = planConfig.overageRate;
      }
    }

    // Add usage info to request for logging
    req.usageInfo = {
      minutesUsed: subscription.usage?.minutesThisMonth || 0,
      minutesIncluded: planConfig.includedMinutes,
      activeCalls,
      concurrencyLimit,
      plan,
    };

    next();
  } catch (error) {
    logger.error('Error checking usage limits:', error);
    // Don't block on error, just log and continue
    next();
  }
};

/**
 * Check concurrency limit before starting call processing
 */
exports.checkConcurrency = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const subscription = user.subscription || {};
    const plan = subscription.plan || 'free';
    const planConfig = PLAN_CONFIG[plan];

    const activeCalls = subscription.usage?.activeCalls || 0;
    const concurrencyLimit = planConfig.limits.concurrentCalls;

    if (concurrencyLimit !== -1 && activeCalls >= concurrencyLimit) {
      return res.status(429).json({
        success: false,
        message: `Concurrency limit reached (${activeCalls}/${concurrencyLimit}). Please wait for calls to complete.`,
        concurrencyExceeded: true,
        activeCalls,
        limit: concurrencyLimit,
      });
    }

    // Increment active calls
    user.subscription.usage = user.subscription.usage || {};
    user.subscription.usage.activeCalls = (user.subscription.usage.activeCalls || 0) + 1;
    await user.save();

    // Store in request for cleanup
    req.incrementedConcurrency = true;

    next();
  } catch (error) {
    logger.error('Error checking concurrency:', error);
    next();
  }
};

/**
 * Decrement concurrency counter after call processing completes
 */
exports.decrementConcurrency = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (user && user.subscription.usage) {
      user.subscription.usage.activeCalls = Math.max(0, (user.subscription.usage.activeCalls || 1) - 1);
      await user.save();
      logger.info('Decremented concurrency counter', {
        userId,
        activeCalls: user.subscription.usage.activeCalls,
      });
    }
  } catch (error) {
    logger.error('Error decrementing concurrency:', error);
  }
};

/**
 * Update usage metrics after call processing
 */
exports.updateUsageMetrics = async (userId, callDurationSeconds) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const durationMinutes = Math.ceil(callDurationSeconds / 60);
    const planConfig = PLAN_CONFIG[user.subscription.plan];

    // Initialize usage if not exists
    if (!user.subscription.usage) {
      user.subscription.usage = {
        minutesThisMonth: 0,
        minutesIncluded: planConfig.includedMinutes,
        overageMinutes: 0,
        overageCharges: 0,
        lastResetDate: new Date(),
        alertsSent: [],
        callsThisMonth: 0,
        activeCalls: 0,
      };
    }

    // Update minute usage
    user.subscription.usage.minutesThisMonth += durationMinutes;
    user.subscription.usage.callsThisMonth += 1;

    // Calculate overage if applicable
    if (user.subscription.plan !== 'free') {
      const includedMinutes = user.subscription.usage.minutesIncluded || planConfig.includedMinutes;
      if (user.subscription.usage.minutesThisMonth > includedMinutes) {
        const overageMinutes = user.subscription.usage.minutesThisMonth - includedMinutes;
        const overageRate = planConfig.overageRate;
        
        user.subscription.usage.overageMinutes = overageMinutes;
        user.subscription.usage.overageCharges = overageMinutes * overageRate;

        logger.info('Overage charges calculated', {
          userId,
          overageMinutes,
          overageRate,
          overageCharges: user.subscription.usage.overageCharges,
        });
      }
    }

    await user.save();

    logger.info('Usage metrics updated', {
      userId,
      plan: user.subscription.plan,
      minutesUsed: user.subscription.usage.minutesThisMonth,
      callsProcessed: user.subscription.usage.callsThisMonth,
      durationMinutes,
    });

    // Check if usage alerts should be sent
    await checkAndSendUsageAlerts(user);

  } catch (error) {
    logger.error('Error updating usage metrics:', error);
  }
};

/**
 * Check usage thresholds and trigger alerts
 */
const checkAndSendUsageAlerts = async (user) => {
  try {
    const usage = user.subscription.usage;
    if (!usage || !usage.minutesIncluded || user.subscription.plan === 'free') return;

    const usagePercent = usage.minutesThisMonth / usage.minutesIncluded;
    const thresholds = config.subscription.usageAlertThresholds; // [0.8, 0.9, 1.0, 1.2]

    for (const threshold of thresholds) {
      if (usagePercent >= threshold && (!usage.alertsSent || !usage.alertsSent.includes(threshold))) {
        // Send alert (implement email service separately)
        logger.warn('Usage threshold reached', {
          userId: user._id,
          email: user.email,
          threshold: `${threshold * 100}%`,
          minutesUsed: usage.minutesThisMonth,
          minutesIncluded: usage.minutesIncluded,
        });

        // Mark alert as sent
        if (!usage.alertsSent) usage.alertsSent = [];
        usage.alertsSent.push(threshold);
        await user.save();

        // TODO: Call email service to send notification
      }
    }
  } catch (error) {
    logger.error('Error checking usage alerts:', error);
  }
};

/**
 * Get current usage statistics for a user
 */
exports.getUsageStats = async (userId, plan) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
    const usage = user.subscription.usage || {};

    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count calls this month
    const callsThisMonth = await Call.countDocuments({
      uploadedBy: userId,
      createdAt: { $gte: startOfMonth },
    });

    // Calculate storage used (sum of file sizes)
    const storageResult = await Call.aggregate([
      {
        $match: {
          uploadedBy: userId,
        },
      },
      {
        $group: {
          _id: null,
          totalStorage: { $sum: '$fileSize' },
        },
      },
    ]);

    const storageUsedBytes = storageResult.length > 0 ? storageResult[0].totalStorage : 0;
    const storageUsedGB = storageUsedBytes / (1024 * 1024 * 1024);

    return {
      minutes: {
        used: usage.minutesThisMonth || 0,
        included: planConfig.includedMinutes,
        remaining: Math.max(0, planConfig.includedMinutes - (usage.minutesThisMonth || 0)),
        overage: usage.overageMinutes || 0,
        overageCharges: usage.overageCharges || 0,
      },
      calls: {
        used: callsThisMonth,
        limit: planConfig.limits.callsPerMonth,
        remaining: planConfig.limits.callsPerMonth === -1 ? -1 : Math.max(0, planConfig.limits.callsPerMonth - callsThisMonth),
        unlimited: planConfig.limits.callsPerMonth === -1,
      },
      concurrency: {
        active: usage.activeCalls || 0,
        limit: planConfig.limits.concurrentCalls,
        available: planConfig.limits.concurrentCalls === -1 ? -1 : Math.max(0, planConfig.limits.concurrentCalls - (usage.activeCalls || 0)),
        unlimited: planConfig.limits.concurrentCalls === -1,
      },
      storage: {
        usedGB: parseFloat(storageUsedGB.toFixed(2)),
        limitGB: planConfig.limits.storageGB,
        remainingGB: planConfig.limits.storageGB === -1 ? -1 : parseFloat(Math.max(0, planConfig.limits.storageGB - storageUsedGB).toFixed(2)),
        unlimited: planConfig.limits.storageGB === -1,
      },
      plan,
    };
  } catch (error) {
    logger.error('Error getting usage stats:', error);
    return null;
  }
};

module.exports.PLAN_CONFIG = PLAN_CONFIG;
