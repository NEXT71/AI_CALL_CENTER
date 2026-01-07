const User = require('../models/User');
const stripeService = require('../services/stripeService');
const auditService = require('../services/auditService');
const { getUsageStats } = require('../middleware/usageLimits');
const logger = require('../config/logger');
const Stripe = require('stripe');

// Initialize Stripe conditionally
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
}

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get available subscription plans
 * @access  Public
 */
exports.getPlans = async (req, res, next) => {
  try {
    const plans = Object.entries(stripeService.PLANS).map(([key, plan]) => ({
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

    // Handle free plan - no Stripe checkout needed
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

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const session = await stripeService.createCheckoutSession(user, planType);

    // Update user with customer ID if created
    if (session.customer && !user.subscription.stripeCustomerId) {
      user.subscription.stripeCustomerId = session.customer;
      await user.save();
    }

    // Log subscription attempt
    await auditService.createAuditLog({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'SUBSCRIPTION_CHECKOUT',
      resourceType: 'Subscription',
      details: { planType, sessionId: session.id },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
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
 * @desc    Verify checkout session and update subscription (fallback if webhook fails)
 * @access  Private
 */
exports.verifySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if Stripe is configured
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe not configured',
      });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    // Verify session belongs to this user
    if (session.metadata.userId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // If payment was successful, update user subscription
    // For test mode, be more lenient with payment status
    const isTestMode = process.env.STRIPE_SECRET_KEY?.includes('test');
    const isPaymentComplete = (session.payment_status === 'paid' && session.status === 'complete') || 
                             (isTestMode && session.status === 'complete');
    
    if (isPaymentComplete) {
      const planType = session.metadata.planType;

      // Update user subscription info
      user.subscription.stripeCustomerId = session.customer.id || session.customer;
      user.subscription.stripeSubscriptionId = session.subscription;
      user.subscription.plan = planType;
      user.subscription.status = 'active';
      
      // If subscription is expanded, set period dates
      if (session.subscription && typeof session.subscription === 'object') {
        user.subscription.currentPeriodStart = new Date(session.subscription.current_period_start * 1000);
        user.subscription.currentPeriodEnd = new Date(session.subscription.current_period_end * 1000);
      }

      await user.save();

      logger.info('Subscription verified and activated via verifySession:', {
        userId: user._id,
        planType,
        sessionId,
        subscriptionId: session.subscription,
        isTestMode,
      });

      return res.status(200).json({
        success: true,
        message: 'Subscription activated successfully',
        data: {
          plan: user.subscription.plan,
          status: user.subscription.status,
        },
      });
    } else {
      logger.warn('Session not paid or complete:', {
        sessionId,
        paymentStatus: session.payment_status,
        status: session.status,
        isTestMode,
      });

      // For test mode, still try to activate if session is complete
      if (isTestMode && session.status === 'complete') {
        const planType = session.metadata.planType;
        
        user.subscription.plan = planType;
        user.subscription.status = 'active';
        await user.save();

        logger.info('Test mode: Subscription activated despite payment status:', {
          userId: user._id,
          planType,
          sessionId,
        });

        return res.status(200).json({
          success: true,
          message: 'Subscription activated (test mode)',
          data: {
            plan: user.subscription.plan,
            status: user.subscription.status,
          },
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
      });
    }
  } catch (error) {
    logger.error('Error verifying session:', error);
    next(error);
  }
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
      plan: user.subscription?.plan || 'starter',
      status: user.subscription?.status || 'trial',
      trialEndsAt: user.subscription?.trialEndsAt,
      currentPeriodStart: user.subscription?.currentPeriodStart,
      currentPeriodEnd: user.subscription?.currentPeriodEnd,
    };

    // If user has active Stripe subscription, get latest details
    if (user.subscription?.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripeService.getSubscription(
          user.subscription.stripeSubscriptionId
        );

        subscriptionDetails = {
          ...subscriptionDetails,
          stripeStatus: stripeSubscription.status,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          cancelAt: stripeSubscription.cancel_at,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        };
      } catch (error) {
        logger.error('Error fetching Stripe subscription:', error);
      }
    }

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

    if (!user.subscription?.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found',
      });
    }

    const subscription = await stripeService.cancelSubscription(
      user.subscription.stripeSubscriptionId
    );

    // Log cancellation
    await auditService.createAuditLog({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'SUBSCRIPTION_CANCELLED',
      resourceType: 'Subscription',
      details: { 
        subscriptionId: subscription.id,
        cancelAt: subscription.cancel_at,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    res.status(200).json({
      success: true,
      message: 'Subscription will be cancelled at period end',
      data: {
        cancelAt: new Date(subscription.cancel_at * 1000),
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

    if (!user.subscription?.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No subscription found',
      });
    }

    const subscription = await stripeService.reactivateSubscription(
      user.subscription.stripeSubscriptionId
    );

    // Log reactivation
    await auditService.createAuditLog({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'SUBSCRIPTION_REACTIVATED',
      resourceType: 'Subscription',
      details: { subscriptionId: subscription.id },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    res.status(200).json({
      success: true,
      message: 'Subscription reactivated successfully',
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

    if (!user.subscription?.stripeCustomerId) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const invoices = await stripeService.getInvoices(
      user.subscription.stripeCustomerId
    );

    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      date: new Date(invoice.created * 1000),
      pdfUrl: invoice.invoice_pdf,
      hostedUrl: invoice.hosted_invoice_url,
    }));

    res.status(200).json({
      success: true,
      data: formattedInvoices,
    });
  } catch (error) {
    logger.error('Error fetching invoices:', error);
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
