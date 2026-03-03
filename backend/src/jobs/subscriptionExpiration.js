const cron = require('node-cron');
const User = require('../models/User');
const logger = require('../config/logger');
const emailService = require('../services/emailService');
const usageAlerts = require('../services/usageAlerts');
const config = require('../config/config');

/**
 * Check for expired subscriptions and trials
 * Runs every hour
 */
const checkExpiredSubscriptions = async () => {
  try {
    logger.info('Running subscription expiration check...');
    const now = new Date();

    // Find expired active subscriptions
    const expiredSubscriptions = await User.find({
      'subscription.status': 'active',
      'subscription.currentPeriodEnd': { $lt: now },
    });

    let expiredCount = 0;
    for (const user of expiredSubscriptions) {
      logger.info('Expiring subscription', {
        userId: user._id,
        plan: user.subscription.plan,
        expiredOn: user.subscription.currentPeriodEnd,
      });

      // Downgrade to free
      user.subscription.status = 'expired';
      const previousPlan = user.subscription.plan;
      user.subscription.plan = 'free';
      await user.save();

      // Send email notification
      try {
        await emailService.sendEmail(
          user.email,
          'Subscription Expired',
          `Your ${previousPlan} subscription has expired. You have been downgraded to the free plan. Please renew to continue using premium features.`
        );
      } catch (emailError) {
        logger.error('Failed to send expiration email', { userId: user._id, error: emailError.message });
      }

      expiredCount++;
    }

    // Find expired trials
    const expiredTrials = await User.find({
      'subscription.status': 'trial',
      'subscription.trialEndsAt': { $lt: now },
    });

    let trialExpiredCount = 0;
    for (const user of expiredTrials) {
      logger.info('Expiring trial', {
        userId: user._id,
        trialEndedOn: user.subscription.trialEndsAt,
      });

      user.subscription.status = 'expired';
      user.subscription.plan = 'free';
      await user.save();

      // Send email notification
      try {
        await emailService.sendEmail(
          user.email,
          'Trial Expired',
          'Your free trial has expired. Upgrade to a paid plan to continue using premium features.'
        );
      } catch (emailError) {
        logger.error('Failed to send trial expiration email', { userId: user._id, error: emailError.message });
      }

      trialExpiredCount++;
    }

    logger.info('Subscription expiration check complete', {
      subscriptionsExpired: expiredCount,
      trialsExpired: trialExpiredCount,
    });

  } catch (error) {
    logger.error('Error in subscription expiration check:', error);
  }
};

/**
 * Check for subscriptions expiring soon (3 days warning)
 */
const checkExpiringSubscriptions = async () => {
  try {
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const expiringSubscriptions = await User.find({
      'subscription.status': 'active',
      'subscription.currentPeriodEnd': {
        $gte: now,
        $lte: threeDaysFromNow,
      },
    });

    for (const user of expiringSubscriptions) {
      const daysRemaining = Math.ceil((new Date(user.subscription.currentPeriodEnd) - now) / (1000 * 60 * 60 * 24));
      
      try {
        await emailService.sendEmail(
          user.email,
          'Subscription Expiring Soon',
          `Your ${user.subscription.plan} subscription will expire in ${daysRemaining} days. Please renew to avoid interruption.`
        );
        
        logger.info('Sent expiration warning', {
          userId: user._id,
          daysRemaining,
        });
      } catch (emailError) {
        logger.error('Failed to send expiration warning', { userId: user._id, error: emailError.message });
      }
    }
  } catch (error) {
    logger.error('Error checking expiring subscriptions:', error);
  }
};

/**
 * Monthly billing cycle - reset usage counters and charge overages
 * Runs on the 1st of each month at midnight
 */
const monthlyBillingCycle = async () => {
  try {
    logger.info('Running monthly billing cycle...');
    const users = await User.find({ 
      'subscription.status': 'active',
      'subscription.plan': { $in: ['starter', 'professional', 'enterprise'] }
    });

    let processedCount = 0;
    let overageCount = 0;
    let totalOverageCharges = 0;

    for (const user of users) {
      const usage = user.subscription.usage;
      const planConfig = config.subscription.plans[user.subscription.plan];

      if (!usage || !planConfig) continue;

      // Send overage summary if applicable
      if (usage.overageMinutes > 0 && usage.overageCharges > 0) {
        await usageAlerts.sendOverageSummary(user._id);
        overageCount++;
        totalOverageCharges += usage.overageCharges;

        logger.info('Overage charges recorded', {
          userId: user._id,
          email: user.email,
          plan: user.subscription.plan,
          overageMinutes: usage.overageMinutes,
          overageCharges: usage.overageCharges,
        });

        // TODO: Charge overage via Stripe
        // await stripeService.chargeOverage(user.stripeCustomerId, usage.overageCharges);
      }

      // Reset monthly counters
      user.subscription.usage = {
        minutesThisMonth: 0,
        minutesIncluded: planConfig.includedMinutes,
        overageMinutes: 0,
        overageCharges: 0,
        lastResetDate: new Date(),
        alertsSent: [],
        callsThisMonth: 0,
        activeCalls: usage.activeCalls || 0, // Keep active calls counter
      };

      await user.save();
      processedCount++;
    }

    logger.info('Monthly billing cycle complete', {
      usersProcessed: processedCount,
      usersWithOverage: overageCount,
      totalOverageCharges: totalOverageCharges.toFixed(2),
    });

  } catch (error) {
    logger.error('Error in monthly billing cycle:', error);
  }
};

/**
 * Initialize subscription management cron jobs
 */
exports.initSubscriptionJobs = () => {
  // Check expired subscriptions every hour
  cron.schedule('0 * * * *', () => {
    logger.info('Starting scheduled subscription expiration check');
    checkExpiredSubscriptions();
  });

  // Check expiring subscriptions (3-day warning) once daily at 9 AM
  cron.schedule('0 9 * * *', () => {
    logger.info('Starting scheduled expiration warning check');
    checkExpiringSubscriptions();
  });

  // Monthly billing cycle - runs on 1st of each month at midnight
  cron.schedule('0 0 1 * *', () => {
    logger.info('Starting monthly billing cycle');
    monthlyBillingCycle();
  });

  logger.info('Subscription management cron jobs initialized');

  // Run immediately on startup
  checkExpiredSubscriptions();
};

// Export for manual execution
exports.checkExpiredSubscriptions = checkExpiredSubscriptions;
exports.checkExpiringSubscriptions = checkExpiringSubscriptions;
exports.monthlyBillingCycle = monthlyBillingCycle;
