const User = require('../models/User');
const stripeService = require('../services/stripeService');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle Stripe webhook events
 * @access  Public (verified by Stripe signature)
 */
exports.handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    // Construct event from raw body and signature
    event = stripeService.constructWebhookEvent(req.body, signature);
  } catch (error) {
    logger.error('Webhook signature verification failed:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  logger.info('Stripe webhook received:', { type: event.type });

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      default:
        logger.info('Unhandled webhook event type:', event.type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session) {
  const userId = session.metadata.userId;
  const planType = session.metadata.planType;

  const user = await User.findById(userId);
  if (!user) {
    logger.error('User not found for checkout session:', { userId });
    return;
  }

  // Update user subscription
  user.subscription.stripeCustomerId = session.customer;
  user.subscription.stripeSubscriptionId = session.subscription;
  user.subscription.plan = planType;
  user.subscription.status = 'active';
  
  await user.save();

  logger.info('Checkout session completed:', {
    userId,
    planType,
    subscriptionId: session.subscription,
  });
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata.userId;
  const planType = subscription.metadata.planType;

  const user = await User.findById(userId);
  if (!user) {
    logger.error('User not found for subscription:', { userId });
    return;
  }

  user.subscription.stripeSubscriptionId = subscription.id;
  user.subscription.plan = planType;
  user.subscription.status = 'active';
  user.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await user.save();

  logger.info('Subscription created:', {
    userId,
    subscriptionId: subscription.id,
  });
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  const user = await User.findOne({
    'subscription.stripeSubscriptionId': subscription.id,
  });

  if (!user) {
    logger.error('User not found for subscription update:', {
      subscriptionId: subscription.id,
    });
    return;
  }

  // Update subscription status
  const statusMap = {
    active: 'active',
    past_due: 'active',
    unpaid: 'expired',
    canceled: 'cancelled',
    incomplete: 'trial',
    incomplete_expired: 'expired',
    trialing: 'trial',
  };

  user.subscription.status = statusMap[subscription.status] || 'active';
  user.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await user.save();

  logger.info('Subscription updated:', {
    userId: user._id,
    subscriptionId: subscription.id,
    status: subscription.status,
  });
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription) {
  const user = await User.findOne({
    'subscription.stripeSubscriptionId': subscription.id,
  });

  if (!user) {
    logger.error('User not found for subscription deletion:', {
      subscriptionId: subscription.id,
    });
    return;
  }

  user.subscription.status = 'cancelled';
  user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await user.save();

  logger.info('Subscription deleted:', {
    userId: user._id,
    subscriptionId: subscription.id,
  });
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice) {
  const user = await User.findOne({
    'subscription.stripeCustomerId': invoice.customer,
  });

  if (!user) {
    logger.error('User not found for invoice:', {
      customerId: invoice.customer,
    });
    return;
  }

  // Update subscription status to active on successful payment
  if (user.subscription.status !== 'active') {
    user.subscription.status = 'active';
    await user.save();
  }

  logger.info('Invoice paid:', {
    userId: user._id,
    invoiceId: invoice.id,
    amount: invoice.amount_paid / 100,
  });

  // Optional: Send payment confirmation email
  // await emailService.sendPaymentConfirmationEmail(user, invoice);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice) {
  const user = await User.findOne({
    'subscription.stripeCustomerId': invoice.customer,
  });

  if (!user) {
    logger.error('User not found for failed payment:', {
      customerId: invoice.customer,
    });
    return;
  }

  logger.warn('Invoice payment failed:', {
    userId: user._id,
    invoiceId: invoice.id,
    amount: invoice.amount_due / 100,
  });

  // Optional: Send payment failed notification email
  // await emailService.sendPaymentFailedEmail(user, invoice);
}

/**
 * Handle trial ending soon
 */
async function handleTrialWillEnd(subscription) {
  const user = await User.findOne({
    'subscription.stripeSubscriptionId': subscription.id,
  });

  if (!user) {
    logger.error('User not found for trial ending:', {
      subscriptionId: subscription.id,
    });
    return;
  }

  logger.info('Trial ending soon:', {
    userId: user._id,
    trialEnd: new Date(subscription.trial_end * 1000),
  });

  // Optional: Send trial ending notification email
  // await emailService.sendTrialEndingEmail(user, subscription);
}
