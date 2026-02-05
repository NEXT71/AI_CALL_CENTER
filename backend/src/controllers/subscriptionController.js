const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Payment = require('../models/Payment');
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
 * @desc    DISABLED - Users cannot self-activate. Use admin activation instead.
 * @access  Private
 */
exports.activateSubscription = async (req, res, next) => {
  return res.status(403).json({
    success: false,
    message: 'Self-activation is not allowed. Please contact an administrator to activate your subscription after payment.',
    requiresAdminApproval: true,
  });
};

/**
 * @route   POST /api/subscriptions/request
 * @desc    Request a subscription - Creates pending payment for admin approval
 * @access  Private
 */
exports.requestSubscription = async (req, res, next) => {
  try {
    const { planType, billingCycle, paymentMethod, paymentAmount, paymentReference, transactionId, notes } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!planType || !billingCycle) {
      return res.status(400).json({
        success: false,
        message: 'Plan type and billing cycle are required',
      });
    }

    // Validate plan type
    const validPlans = ['starter', 'professional', 'enterprise'];
    if (!validPlans.includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type',
      });
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        message: 'Billing cycle must be monthly or yearly',
      });
    }

    // Get plan pricing
    const planPricing = {
      starter: { monthly: 99, yearly: 950 },
      professional: { monthly: 299, yearly: 2870 },
      enterprise: { monthly: 999, yearly: 9590 },
    };

    const expectedAmount = planPricing[planType][billingCycle];

    // Validate payment amount if provided
    if (paymentAmount && paymentAmount < expectedAmount * 0.95) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ($${paymentAmount}) is significantly less than expected amount ($${expectedAmount}) for ${planType} ${billingCycle} plan`,
        expectedAmount,
      });
    }

    // Check for existing pending payment to prevent duplicates
    const existingPendingPayment = await Payment.findOne({
      userId,
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (existingPendingPayment) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending subscription request. Please wait for admin approval or contact support.',
        existingRequest: {
          invoiceNumber: existingPendingPayment.invoiceNumber,
          planType: existingPendingPayment.planType,
          createdAt: existingPendingPayment.createdAt,
        },
      });
    }

    // Create pending payment record
    const payment = await Payment.create({
      userId,
      planType,
      billingCycle,
      amount: paymentAmount || expectedAmount,
      currency: 'USD',
      paymentMethod: paymentMethod || 'other',
      paymentReference: paymentReference || 'User request - awaiting payment proof',
      transactionId: transactionId || null,
      status: 'pending',
      userNotes: notes || `User requested ${planType} ${billingCycle} subscription`,
    });

    // Log the request
    await AuditLog.create({
      userId,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'SUBSCRIPTION_REQUEST_CREATED',
      resourceType: 'Subscription',
      details: {
        planType,
        billingCycle,
        expectedAmount,
        paymentId: payment._id,
        invoiceNumber: payment.invoiceNumber,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Subscription request submitted successfully. An administrator will review and activate your subscription after payment verification.',
      data: {
        paymentId: payment._id,
        invoiceNumber: payment.invoiceNumber,
        planType,
        billingCycle,
        amount: payment.amount,
        status: 'pending',
      },
    });
  } catch (error) {
    logger.error('Error creating subscription request:', error);
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

    // Mark subscription as cancelled
    const previousPlan = user.subscription.plan;
    user.subscription.status = 'cancelled';
    
    // Keep access until current period ends
    if (!user.subscription.currentPeriodEnd) {
      // If no period end, cancel immediately
      user.subscription.plan = 'free';
      user.subscription.currentPeriodEnd = new Date();
    }
    // Otherwise user keeps access until currentPeriodEnd

    await user.save();

    // Log the cancellation
    await auditService.createAuditLog({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'SUBSCRIPTION_CANCELLED',
      resourceType: 'Subscription',
      details: {
        previousPlan,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        cancelledAt: new Date(),
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    logger.info('Subscription cancelled', {
      userId: user._id,
      plan: previousPlan,
      accessUntil: user.subscription.currentPeriodEnd,
    });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        status: 'cancelled',
        plan: previousPlan,
        accessUntil: user.subscription.currentPeriodEnd,
        message: user.subscription.currentPeriodEnd 
          ? `You will have access to ${previousPlan} features until ${new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}`
          : 'Your subscription has been cancelled immediately',
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
    const { 
      userId, 
      planType,
      billingCycle,
      paymentMethod, 
      paymentAmount,
      paymentReference,
      transactionId,
      paymentDate,
      notes 
    } = req.body;

    // Check if requester is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Validate required fields - Payment proof is MANDATORY for security and audit compliance
    if (!userId || !planType || !billingCycle) {
      return res.status(400).json({
        success: false,
        message: 'User ID, plan type, and billing cycle are required',
      });
    }

    // SECURITY: Payment proof is REQUIRED to prevent fraud
    if (!paymentMethod || !paymentAmount || !paymentReference) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof required: paymentMethod, paymentAmount, and paymentReference are mandatory for audit compliance',
        requiredFields: ['paymentMethod', 'paymentAmount', 'paymentReference'],
        reason: 'Payment verification is required to prevent unauthorized subscription activations',
      });
    }

    // Validate payment reference is not empty
    if (!paymentReference.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference cannot be empty. Please provide a valid receipt/transaction number.',
      });
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        message: 'Billing cycle must be monthly or yearly',
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

    // Get plan pricing and validate payment
    const planPricing = {
      starter: { monthly: 149, yearly: 1490 },
      professional: { monthly: 249, yearly: 2490 },
      enterprise: { monthly: 399, yearly: 3990 },
    };

    const expectedAmount = planPricing[planType][billingCycle];

    // SECURITY: Verify payment amount matches expected amount (with small tolerance for fees)
    if (paymentAmount < expectedAmount * 0.95) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ($${paymentAmount}) is less than the required amount ($${expectedAmount}) for ${planType} ${billingCycle} plan`,
        expectedAmount,
        providedAmount: paymentAmount,
        minimumRequired: expectedAmount * 0.95,
      });
    }

    // Calculate subscription duration based on billing cycle
    const subscriptionDuration = billingCycle === 'monthly' ? 30 : 365; // days
    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + subscriptionDuration * 24 * 60 * 60 * 1000);

    // Create payment record with VERIFIED payment details
    const payment = new Payment({
      userId: user._id,
      planType,
      billingCycle,
      amount: paymentAmount,
      paymentMethod: paymentMethod.toLowerCase(),
      paymentReference: paymentReference.trim(),
      transactionId: transactionId ? transactionId.trim() : null,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      status: 'approved',
      approvedBy: req.user._id,
      approvedAt: new Date(),
      subscriptionPeriodStart: periodStart,
      subscriptionPeriodEnd: periodEnd,
      adminNotes: notes || 'Subscription activated by admin with payment verification',
    });

    await payment.save();

    // Update subscription to active
    user.subscription.plan = planType;
    user.subscription.status = 'active';
    user.subscription.billingCycle = billingCycle;
    user.subscription.currentPeriodStart = periodStart;
    user.subscription.currentPeriodEnd = periodEnd;
    user.subscription.autoRenew = false;

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
      message: 'Subscription activated successfully with payment record',
      data: {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        plan: user.subscription.plan,
        status: user.subscription.status,
        activatedAt: new Date(),
        payment: {
          id: payment._id,
          invoiceNumber: payment.invoiceNumber,
          amount: payment.amount,
          paymentReference: payment.paymentReference,
        },
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

    // Find payments that are pending or verified (awaiting admin approval)
    const pendingPayments = await Payment.find({
      status: { $in: ['pending', 'verified'] }
    })
      .populate('userId', 'name email companyName')
      .sort({ createdAt: -1 });

    // Format the response
    const formattedPayments = pendingPayments.map(payment => ({
      paymentId: payment._id,
      invoiceNumber: payment.invoiceNumber,
      userId: payment.userId._id,
      userName: payment.userId.name,
      userEmail: payment.userId.email,
      companyName: payment.userId.companyName,
      planType: payment.planType,
      billingCycle: payment.billingCycle,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference,
      transactionId: payment.transactionId,
      proofDocuments: payment.proofDocuments,
      status: payment.status,
      requestedAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      notes: payment.userNotes || payment.adminNotes,
    }));

    res.status(200).json({
      success: true,
      count: formattedPayments.length,
      data: formattedPayments,
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

/**
 * @route   POST /api/subscriptions/admin-approve-payment/:paymentId
 * @desc    Admin approves a payment and activates subscription
 * @access  Admin only
 */
exports.approvePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { notes } = req.body;

    // Check if requester is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Find the payment
    const payment = await Payment.findById(paymentId).populate('userId');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check if payment is in a state that can be approved
    if (payment.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been approved',
      });
    }

    if (payment.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve a rejected payment',
      });
    }

    // Update payment status
    payment.status = 'approved';
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    if (notes) {
      payment.notes = notes;
    }
    await payment.save();

    // Activate the user's subscription
    const user = payment.userId;
    const subscriptionDuration = payment.billingCycle === 'monthly' ? 30 : 365; // days
    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + subscriptionDuration * 24 * 60 * 60 * 1000);
    
    user.subscription = {
      status: 'active',
      plan: payment.planType,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      billingCycle: payment.billingCycle,
      autoRenew: false, // Manual payments don't auto-renew
    };

    // Clear trial if exists
    if (user.trial) {
      user.trial = undefined;
    }

    await user.save();

    // Log the activation
    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'SUBSCRIPTION_ACTIVATED_MANUAL',
      resourceType: 'Subscription',
      details: {
        planType: payment.planType,
        billingCycle: payment.billingCycle,
        paymentId: payment._id,
        invoiceNumber: payment.invoiceNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        approvedBy: req.user.email,
      },
      ipAddress: req.ip,
    });

    // TODO: Send confirmation email to user
    // await emailService.sendSubscriptionActivatedEmail(user.email, {
    //   planType: payment.planType,
    //   invoiceNumber: payment.invoiceNumber,
    // });

    res.status(200).json({
      success: true,
      message: 'Payment approved and subscription activated',
      data: {
        payment: {
          id: payment._id,
          invoiceNumber: payment.invoiceNumber,
          status: payment.status,
          approvedAt: payment.approvedAt,
        },
        subscription: {
          status: user.subscription.status,
          plan: user.subscription.plan,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
        },
      },
    });
  } catch (error) {
    logger.error('Error approving payment:', error);
    next(error);
  }
};

/**
 * @route   POST /api/subscriptions/admin-reject-payment/:paymentId
 * @desc    Admin rejects a payment
 * @access  Admin only
 */
exports.rejectPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    // Check if requester is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    // Find the payment
    const payment = await Payment.findById(paymentId).populate('userId');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check if payment is in a state that can be rejected
    if (payment.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject an approved payment',
      });
    }

    if (payment.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been rejected',
      });
    }

    // Update payment status
    payment.status = 'rejected';
    payment.notes = reason;
    await payment.save();

    // Log the rejection
    await AuditLog.create({
      userId: payment.userId._id,
      userName: payment.userId.name,
      userRole: payment.userId.role,
      action: 'SUBSCRIPTION_PAYMENT_REJECTED',
      resourceType: 'Subscription',
      details: {
        planType: payment.planType,
        paymentId: payment._id,
        invoiceNumber: payment.invoiceNumber,
        amount: payment.amount,
        reason: reason,
        rejectedBy: req.user.email,
      },
      ipAddress: req.ip,
    });

    // TODO: Send rejection email to user
    // await emailService.sendPaymentRejectedEmail(payment.userId.email, {
    //   invoiceNumber: payment.invoiceNumber,
    //   reason: reason,
    // });

    res.status(200).json({
      success: true,
      message: 'Payment rejected',
      data: {
        paymentId: payment._id,
        invoiceNumber: payment.invoiceNumber,
        status: payment.status,
        reason: reason,
      },
    });
  } catch (error) {
    logger.error('Error rejecting payment:', error);
    next(error);
  }
};
