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
  try {
    const userId = session.metadata?.userId;
    const planType = session.metadata?.planType;

    if (!userId || !planType) {
      logger.error('Missing metadata in checkout session:', { sessionId: session.id, metadata: session.metadata });
      return;
    }

    // Validate plan type
    if (!['starter', 'professional', 'enterprise'].includes(planType)) {
      logger.error('Invalid plan type in checkout session:', { planType, sessionId: session.id });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.error('User not found for checkout session:', { userId, sessionId: session.id });
      return;
    }

    // Update user subscription
    user.subscription.stripeCustomerId = session.customer;
    user.subscription.stripeSubscriptionId = session.subscription;
    user.subscription.plan = planType;
    user.subscription.status = 'active'; // Set to active immediately for successful checkout
    
    await user.save();

    logger.info('Checkout session completed and subscription activated:', {
      userId,
      planType,
      sessionId: session.id,
      subscriptionId: session.subscription,
    });
  } catch (error) {
    logger.error('Error handling checkout session completed:', error);
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata.userId;
  const planType = subscription.metadata.planType;

  if (!userId || !planType) {
    logger.error('Missing metadata in subscription:', { subscriptionId: subscription.id, metadata: subscription.metadata });
    return;
  }

  // Validate plan type
  if (!['starter', 'professional', 'enterprise'].includes(planType)) {
    logger.error('Invalid plan type in subscription:', { planType, subscriptionId: subscription.id });
    return;
  }

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

/**
 * @route   POST /api/v1/webhooks/runpod
 * @desc    Receive RunPod Serverless results via webhook
 * @access  Public (no auth - validate signature if needed)
 */
exports.handleRunPodWebhook = async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const Call = require('../models/Call');
  const scoringService = require('../services/scoringService');
  
  try {
    const { id: jobId, status, output, error } = req.body;

    logger.info('RunPod webhook received', { 
      jobId, 
      status,
      hasOutput: !!output,
      hasError: !!error 
    });

    // Validate webhook payload
    if (!jobId) {
      logger.error('RunPod webhook missing job ID');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing job ID' 
      });
    }

    // Find call by RunPod job ID
    const call = await Call.findOne({ runpodJobId: jobId });
    if (!call) {
      logger.error('Call not found for RunPod job', { jobId });
      return res.status(404).json({ 
        success: false, 
        message: 'Call not found' 
      });
    }

    // Check if job failed
    if (status === 'FAILED' || error) {
      logger.error('RunPod job failed', { 
        jobId, 
        callId: call.callId, 
        error 
      });

      call.status = 'failed';
      call.processingError = error || 'RunPod job failed';
      await call.save();

      // ⚠️ CRITICAL: Delete audio file to save disk space
      if (call.audioFilePath && fs.existsSync(call.audioFilePath)) {
        try {
          fs.unlinkSync(call.audioFilePath);
          logger.info('Audio file deleted after failed processing', { 
            callId: call.callId, 
            path: call.audioFilePath 
          });
        } catch (unlinkError) {
          logger.error('Failed to delete audio file', { 
            callId: call.callId, 
            error: unlinkError.message 
          });
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Webhook processed (job failed)' 
      });
    }

    // Check if job is still running
    if (status === 'IN_PROGRESS' || status === 'IN_QUEUE') {
      logger.info('RunPod job still processing', { jobId, status });
      return res.status(200).json({ 
        success: true, 
        message: 'Job still processing' 
      });
    }

    // Job completed successfully - extract results
    if (status === 'COMPLETED' && output) {
      logger.info('RunPod job completed successfully', { 
        jobId, 
        callId: call.callId 
      });

      // Update call with AI results from output
      call.transcript = output.transcript || '';
      call.speakerLabeledTranscript = output.speaker_labeled_transcript || '';
      call.detectedLanguage = output.language || 'english';
      call.duration = output.duration || 0;
      call.wordCount = output.word_count || 0;

      // Diarization data
      if (output.speaker_segments) {
        call.speakerSegments = output.speaker_segments;
        call.speakers = output.speakers || [];
      }

      // Talk-time metrics
      if (output.talk_time) {
        call.speakerTalkTime = output.talk_time.speaker_talk_time || {};
        call.agentCustomerRatio = output.talk_time.agent_customer_ratio || 'N/A';
        call.deadAirTotal = output.talk_time.dead_air_total || 0;
        call.deadAirSegments = output.talk_time.dead_air_segments || [];
      }

      // Sentiment analysis
      if (output.sentiment) {
        call.agentSentiment = output.sentiment.agent_sentiment || 'neutral';
        call.customerSentiment = output.sentiment.customer_sentiment || 'neutral';
        call.agentSentimentScore = output.sentiment.agent_score || 0.5;
        call.customerSentimentScore = output.sentiment.customer_score || 0.5;
      }

      // Entities and key phrases
      call.entities = output.entities || [];
      call.keyPhrases = output.key_phrases || [];

      // Summary
      call.summary = output.summary || '';

      // Compliance check (if applicable)
      if (output.compliance) {
        call.missingMandatory = output.compliance.missing_mandatory || [];
        call.detectedForbidden = output.compliance.detected_forbidden || [];
        call.complianceScore = output.compliance.compliance_score || 0;
      }

      // AI Quality Score
      if (output.quality_score) {
        call.aiQualityScore = output.quality_score.overall_score || 0;
        call.aiQualityFactors = output.quality_score.factors || {};
        call.aiQualityDetails = output.quality_score.details || {};
        call.aiQualityFlags = output.quality_score.flags || {};
      }

      // Calculate final quality score using scoring service
      try {
        const scoringResult = scoringService.calculateQualityScore(call);
        call.qualityScore = scoringResult.score;
        call.pointsBreakdown = scoringResult.breakdown;
        call.recommendations = scoringResult.recommendations;
      } catch (scoringError) {
        logger.warn('Failed to calculate quality score', { 
          callId: call.callId, 
          error: scoringError.message 
        });
      }

      // Mark as completed
      call.status = 'completed';
      call.processedAt = new Date();
      await call.save();

      logger.info('Call processing completed', { 
        callId: call.callId, 
        qualityScore: call.qualityScore 
      });

      // ⚠️ CRITICAL: Delete audio file to save disk space after successful processing
      if (call.audioFilePath && fs.existsSync(call.audioFilePath)) {
        try {
          fs.unlinkSync(call.audioFilePath);
          logger.info('Audio file deleted after successful processing', { 
            callId: call.callId, 
            path: call.audioFilePath 
          });
          
          // Optionally clear the audioFilePath field
          call.audioFilePath = null;
          await call.save();
        } catch (unlinkError) {
          logger.error('Failed to delete audio file', { 
            callId: call.callId, 
            error: unlinkError.message 
          });
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Webhook processed successfully' 
      });
    }

    // Unknown status
    logger.warn('Unknown RunPod webhook status', { jobId, status });
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook received but status unknown' 
    });

  } catch (error) {
    logger.error('Webhook processing error', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      message: 'Webhook processing failed' 
    });
  }
};
