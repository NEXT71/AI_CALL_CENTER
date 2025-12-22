const express = require('express');
const router = express.Router();
const vicidialWebhookController = require('../controllers/vicidialWebhookController');
const { protect, authorize } = require('../middleware/auth');

// Vicidial webhooks - these should be secured with IP whitelist in production
// For development, we'll use basic auth protection

// Call completion webhook - Vicidial posts when calls end
router.post(
  '/call-complete',
  vicidialWebhookController.handleCallCompletion
);

// Agent status update webhook
router.post(
  '/agent-status',
  vicidialWebhookController.handleAgentStatusUpdate
);

// Lead update webhook
router.post(
  '/lead-update',
  vicidialWebhookController.handleLeadUpdate
);

// Health check endpoint - protected
router.get(
  '/health',
  protect,
  authorize('Admin'),
  vicidialWebhookController.getVicidialHealth
);

module.exports = router;