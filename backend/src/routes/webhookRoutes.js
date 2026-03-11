const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// RunPod Serverless webhook - receives job results from RunPod serverless endpoint
router.post('/runpod', webhookController.handleRunPodWebhook);

module.exports = router;
