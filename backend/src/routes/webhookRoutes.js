const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Stripe webhook - must be before body parser middleware
// The raw body is needed for signature verification
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  webhookController.handleStripeWebhook
);

// RunPod Serverless webhook - no authentication required (validate via signature if needed)
router.post('/runpod', webhookController.handleRunPodWebhook);

module.exports = router;
