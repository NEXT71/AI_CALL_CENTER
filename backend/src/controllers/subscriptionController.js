const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
// const stripeService = require('../services/stripeService'); // Commented out for manual payments
const auditService = require('../services/auditService');
const { getUsageStats } = require('../middleware/usageLimits');
const logger = require('../config/logger');
// const Stripe = require('stripe'); // Commented out for manual payments

// Local plans configuration for manual payments
// Pod cost: $0.26/hour = ~$187/month for 24/7 usage
const PLANS = {
  free: {
    name: 'Free',
    amount: 0, // $0/month in cents
    interval: 'month',
    features: [
      '10 calls/month',
      'Basic transcription',
      'Community support',
      '1 user',
      '7-day data retention',
    ],
  },
  starter: {
    name: 'Starter',
    amount: 14900, // $149/month in cents (80% of pod cost)
    interval: 'month',
    features: [
      '100 calls/month',
      'Basic analytics',
      'Email support',
      '1 user',
      '1 dedicated pod',
      '30-day data retention',
    ],
  },
  professional: {
    name: 'Professional',
    amount: 24900, // $249/month in cents (133% of pod cost)
    interval: 'month',
    features: [
      '500 calls/month',
      'Advanced analytics',
      'Priority support',
      '5 users',
      '1 dedicated pod',
      'Custom rules',
      'API access',
      '90-day data retention',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    amount: 39900, // $399/month in cents (213% of pod cost)
    interval: 'month',
    features: [
      'Unlimited calls',
      'Full analytics suite',
      'Priority support',
      'Unlimited users',
      '1 dedicated pod',
      'API access',
      'Dedicated account manager',
      '1-year data retention',
    ],
  },
};

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get available subscription plans
 * @access  Public
 */
exports.getPlans = async (req, res, next) => {
  try {
    const plans = Object.entries(PLANS).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      price: plan.amount / 100, // Convert to dollars
      interval: plan.interval,
      features: plan.features,
    }));

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/subscriptions/create-checkout-session
 * @desc    Create Stripe checkout session
 * @access  Private
 */
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { planType } = req.body;

    if (!planType || !['free', 'starter', 'professional', 'enterprise'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type',
      });
    }

    // Handle free plan - no payment needed
    if (planType === 'free') {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Clear any existing Stripe subscription data
      user.subscription.plan = 'free';
      user.subscription.status = 'free';
      user.subscription.stripeSubscriptionId = null;
      user.subscription.currentPeriodStart = null;
      user.subscription.currentPeriodEnd = null;
      await user.save();

      await auditService.createAuditLog({
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        action: 'SUBSCRIPTION_DOWNGRADE',
        resourceType: 'Subscription',
        details: { planType: 'free' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });

      return res.status(200).json({
        success: true,
        message: 'Successfully switched to free plan',
        data: {
          plan: 'free',
          status: 'free',
          url: null, // No URL needed for free tier
        },
      });
    }

    // For paid plans - manual payment required
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Log manual payment request
    const auditLog = await auditService.createAuditLog({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'SUBSCRIPTION_MANUAL_PAYMENT_REQUEST',
      resourceType: 'Subscription',
      details: { planType, paymentMethod: 'manual', requestStatus: 'pending' },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Manual payment required for this plan',
      data: {
        plan: planType,
        status: 'pending_payment',
        paymentRequired: true,
        instructions: 'Contact support to complete payment',
      },
    });
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    
    // Return user-friendly error message
    const errorMessage = error.message.includes('Price ID not configured')
      ? error.message
      : 'Failed to create checkout session. Please try again later.';
    
    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * @route   GET /api/subscriptions/verify-session/:sessionId
 * @desc    Verify checkout session and update subscription (not available for manual payments)
 * @access  Private
 */
exports.verifySession = async (req, res, next) => {
  return res.status(400).json({
    success: false,
    message: 'Session verification not available for manual payments. Please contact support.',
  });
};

/**
 * @route   POST /api/subscriptions/create-portal-session
 * @desc    Create customer portal session (not available for manual payments)
 * @access  Private
 */
exports.createPortalSession = async (req, res, next) => {
  return res.status(400).json({
    success: false,
    message: 'Customer portal not available for manual payments. Please contact support to manage your subscription.',
  });
};

/**
 * @route   POST /api/subscriptions/activate
 * @desc    Manually activate subscription (for testing or webhook fallback)
 * @access  Private
 */
exports.activateSubscription = async (req, res, next) => {
  try {
    const { planType } = req.body;
    
    logger.info('Manual activation requested:', { userId: req.user._id, planType });
    
    if (!planType || !['starter', 'professional', 'enterprise'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update subscription to active
    const wasTrial = user.subscription.status === 'trial';
    user.subscription.plan = planType;
    user.subscription.status = 'active';
    
    // Set trial end to past date if it was in trial
    if (wasTrial) {
      user.subscription.trialEndsAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    }

    await user.save();

    logger.info('Subscription manually activated:', {
      userId: user._id,
      planType,
    });

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        plan: user.subscription.plan,
        status: user.subscription.status,
      },
    });
  } catch (error) {
    logger.error('Error activating subscription:', error);
    next(error);
  }
};

/**
 * @route   GET /api/subscriptions/current
 * @desc    Get current subscription details
 * @access  Private
 */
exports.getCurrentSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let subscriptionDetails = {
      plan: user.subscription?.plan || 'free',
      status: user.subscription?.status || 'inactive',
      trialEndsAt: user.subscription?.trialEndsAt,
      currentPeriodStart: user.subscription?.currentPeriodStart,
      currentPeriodEnd: user.subscription?.currentPeriodEnd,
      paymentMethod: 'manual', // Indicate manual payment system
    };

    // For manual payments, we don't need to fetch from external services
    // All subscription data is stored locally

    res.status(200).json({
      success: true,
      data: subscriptionDetails,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancel subscription (at period end)
 * @access  Private
 */
exports.cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.subscription || user.subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found',
      });
    }

    // For manual payments, cancellation is handled by admin
    // Log the cancellation request
    await auditService.createAuditLog({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'SUBSCRIPTION_CANCEL_REQUEST',
      resourceType: 'Subscription',
      details: {
        planType: user.subscription.plan,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      message: 'Cancellation request submitted. An admin will process your request.',
      data: {
        status: 'pending_admin_review',
        message: 'Your subscription will remain active until an admin processes your cancellation request.',
      },
    });
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    next(error);
  }
};

/**
 * @route   POST /api/subscriptions/reactivate
 * @desc    Reactivate cancelled subscription
 * @access  Private
 */
exports.reactivateSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.subscription) {
      return res.status(400).json({
        success: false,
        message: 'No subscription found',
      });
    }

    // For manual payments, reactivation requires admin approval
    // Log the reactivation request
    await auditService.createAuditLog({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'SUBSCRIPTION_REACTIVATE_REQUEST',
      resourceType: 'Subscription',
      details: {
        planType: user.subscription.plan,
        currentStatus: user.subscription.status,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      message: 'Reactivation request submitted. An admin will process your request.',
      data: {
        status: 'pending_admin_review',
        message: 'Your reactivation request has been submitted for admin review.',
      },
    });
  } catch (error) {
    logger.error('Error reactivating subscription:', error);
    next(error);
  }
};

/**
 * @route   GET /api/subscriptions/invoices
 * @desc    Get customer invoices
 * @access  Private
 */
exports.getInvoices = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // For manual payments, invoices are not generated automatically
    // Return empty array with a note about manual payments
    res.status(200).json({
      success: true,
      data: [],
      message: 'Invoices are not automatically generated for manual payments. Please contact support for payment records.',
    });
  } catch (error) {
    logger.error('Error fetching invoices:', error);
    next(error);
  }
};

/**
 * @route   POST /api/subscriptions/admin-activate
 * @desc    Admin endpoint to manually activate subscription after payment
 * @access  Private (Admin only)
 */
exports.adminActivateSubscription = async (req, res, next) => {
  try {
    const { userId, planType, paymentMethod, notes } = req.body;

    // Check if requester is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    if (!userId || !planType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and plan type are required',
      });
    }

    if (!['starter', 'professional', 'enterprise'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update subscription to active
    user.subscription.plan = planType;
    user.subscription.status = 'active';
    user.subscription.currentPeriodStart = new Date();
    user.subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await user.save();

    // Log admin activation
    await auditService.createAuditLog({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'SUBSCRIPTION_ADMIN_ACTIVATED',
      resourceType: 'Subscription',
      details: {
        planType,
        paymentMethod: paymentMethod || 'manual',
        notes: notes || '',
        activatedBy: req.user._id
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    logger.info('Subscription manually activated by admin:', {
      userId: user._id,
      planType,
      activatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        plan: user.subscription.plan,
        status: user.subscription.status,
        activatedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('Error activating subscription:', error);
    next(error);
  }
};

/**
 * @route   GET /api/subscriptions/pending-payments
 * @desc    Get users with pending manual payments (Admin only)
 * @access  Private (Admin only)
 */
exports.getPendingPayments = async (req, res, next) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Find users with pending payments by checking audit logs
    const auditLogs = await AuditLog.find({
      action: 'SUBSCRIPTION_MANUAL_PAYMENT_REQUEST',
      'details.requestStatus': 'pending',
    }).sort({ createdAt: -1 });

    const pendingUsers = [];
    for (const log of auditLogs) {
      const user = await User.findById(log.userId);
      if (user && user.subscription.status !== 'active') {
        pendingUsers.push({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          requestedPlan: log.details.planType,
          requestedAt: log.createdAt,
          auditLogId: log._id,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: pendingUsers,
    });
  } catch (error) {
    logger.error('Error fetching pending payments:', error);
    next(error);
  }
};

/**
 * @route   GET /api/subscriptions/usage
 * @desc    Get current usage statistics for the user
 * @access  Private
 */
exports.getUsage = async (req, res, next) => {
  try {
    const user = req.user;
    const plan = user.subscription?.plan || 'free';

    const usageStats = await getUsageStats(user._id, plan);

    if (!usageStats) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve usage statistics',
      });
    }

    res.status(200).json({
      success: true,
      data: usageStats,
    });
  } catch (error) {
    logger.error('Error fetching usage stats:', error);
    next(error);
  }
};
