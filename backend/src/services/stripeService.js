const Stripe = require('stripe');
const config = require('../config/config');
const logger = require('../config/logger');

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Pricing plans configuration (Updated March 2026)
const PLANS = {
  free: {
    name: 'Free',
    priceId: null, // No Stripe price for free tier
    amount: 0, // $0/month
    interval: 'month',
    features: [
      '500 minutes/month',
      'Standard transcription',
      'Community support',
      '1 user',
      '14-day data retention',
    ],
    limits: {
      minutesPerMonth: 500,
      storageGB: 2,
      dataRetentionDays: 14,
      teamMembers: 1,
    },
  },
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    amount: 12900, // $129/month in cents
    interval: 'month',
    features: [
      '1,500 minutes/month',
      'Standard AI transcription',
      'Email support',
      '3 team members',
      '30-day data retention',
    ],
  },
  growth: {
    name: 'Growth',
    priceId: process.env.STRIPE_GROWTH_PRICE_ID,
    amount: 19900, // $199/month in cents
    interval: 'month',
    features: [
      '2,500 minutes/month',
      'Enhanced AI analysis',
      'Priority support',
      '5 team members',
      'API access (rate-limited)',
      '60-day data retention',
    ],
  },
  professional: {
    name: 'Professional',
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    amount: 29900, // $299/month in cents
    interval: 'month',
    features: [
      '4,000 minutes/month',
      'Advanced AI analysis',
      'Priority support + live chat',
      '10 team members',
      'API access',
      'Webhooks & SSO',
      '90-day data retention',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    amount: 89900, // $899/month in cents
    interval: 'month',
    features: [
      '15,000 minutes/month',
      'Full AI suite',
      '24/7 support + account manager',
      'Unlimited team members',
      'Custom AI models',
      'White-labeling',
      'SLA guarantees',
      '1-year data retention',
    ],
  },
};

/**
 * Create a Stripe customer
 */
exports.createCustomer = async (user) => {
  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user._id.toString(),
      },
    });

    logger.info('Stripe customer created:', {
      customerId: customer.id,
      userId: user._id,
    });

    return customer;
  } catch (error) {
    logger.error('Error creating Stripe customer:', error);
    throw error;
  }
};

/**
 * Create a checkout session for subscription
 */
exports.createCheckoutSession = async (user, planType) => {
  try {
    const plan = PLANS[planType];
    if (!plan) {
      throw new Error('Invalid plan type');
    }

    // Check if price ID is configured
    if (!plan.priceId) {
      throw new Error(
        `Stripe Price ID not configured for ${planType} plan. ` +
        'Please create products in Stripe Dashboard and add Price IDs to .env file. ' +
        'Visit: https://dashboard.stripe.com/test/products'
      );
    }

    // Create customer if not exists
    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await exports.createCustomer(user);
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancelled`,
      metadata: {
        userId: user._id.toString(),
        planType: planType,
      },
      subscription_data: {
        metadata: {
          userId: user._id.toString(),
          planType: planType,
        },
      },
    });

    logger.info('Checkout session created:', {
      sessionId: session.id,
      userId: user._id,
      plan: planType,
    });

    return session;
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Create a billing portal session for managing subscription
 */
exports.createBillingPortalSession = async (user) => {
  try {
    const customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/settings/billing`,
    });

    return session;
  } catch (error) {
    logger.error('Error creating billing portal session:', error);
    throw error;
  }
};

/**
 * Retrieve subscription details
 */
exports.getSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    logger.error('Error retrieving subscription:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 */
exports.cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    logger.info('Subscription cancelled:', {
      subscriptionId: subscription.id,
      cancelAt: subscription.cancel_at,
    });

    return subscription;
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    throw error;
  }
};

/**
 * Reactivate subscription
 */
exports.reactivateSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    logger.info('Subscription reactivated:', {
      subscriptionId: subscription.id,
    });

    return subscription;
  } catch (error) {
    logger.error('Error reactivating subscription:', error);
    throw error;
  }
};

/**
 * Get payment methods for a customer
 */
exports.getPaymentMethods = async (customerId) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  } catch (error) {
    logger.error('Error retrieving payment methods:', error);
    throw error;
  }
};

/**
 * Get invoices for a customer
 */
exports.getInvoices = async (customerId, limit = 10) => {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: limit,
    });

    return invoices.data;
  } catch (error) {
    logger.error('Error retrieving invoices:', error);
    throw error;
  }
};

/**
 * Verify webhook signature
 */
exports.constructWebhookEvent = (payload, signature) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // In development, if webhook secret is not configured, skip verification
    if (!webhookSecret && process.env.NODE_ENV === 'development') {
      logger.warn('Webhook secret not configured - skipping signature verification (development only)');
      // Parse the payload directly
      return typeof payload === 'string' ? JSON.parse(payload) : payload;
    }
    
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    return event;
  } catch (error) {
    logger.error('Error constructing webhook event:', error);
    throw error;
  }
};

// Export plans configuration
exports.PLANS = PLANS;
