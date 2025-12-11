const User = require('../models/User');
const stripeService = require('../services/stripeService');
const auditService = require('../services/auditService');
const logger = require('../config/logger');

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
    next(error);
  }
};

/**
 * @route   POST /api/subscriptions/create-portal-session
 * @desc    Create Stripe billing portal session
 * @access  Private
 */
exports.createPortalSession = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.subscription?.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found',
      });
    }

    const session = await stripeService.createBillingPortalSession(user);

    res.status(200).json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    logger.error('Error creating portal session:', error);
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
