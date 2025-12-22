const VicidialMapper = require('../utils/vicidialMapping');
const Call = require('../models/Call');
const User = require('../models/User');
const aiService = require('../services/aiService');
const logger = require('../config/logger');

/**
 * Handle Vicidial call completion webhook
 * Vicidial can POST call data to this endpoint when calls complete
 * @route   POST /api/webhooks/vicidial/call-complete
 * @access  Public (should be secured with IP whitelist or API key)
 */
exports.handleCallCompletion = async (req, res) => {
  try {
    const vicidialData = req.body;

    logger.info('Received Vicidial call completion webhook', {
      uniqueid: vicidialData.uniqueid,
      lead_id: vicidialData.lead_id,
      status: vicidialData.status
    });

    // Validate required fields
    if (!vicidialData.uniqueid || !vicidialData.lead_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: uniqueid and lead_id'
      });
    }

    // Map Vicidial data to your format
    const callData = VicidialMapper.mapCallLog(vicidialData);

    // Find agent by Vicidial username
    const agent = await User.findOne({ name: callData.agentName });
    if (agent) {
      callData.agentId = agent._id;
      callData.uploadedBy = agent._id;
    } else {
      logger.warn(`Agent not found for Vicidial user: ${callData.agentName}`);
      // You might want to create a placeholder agent or skip
    }

    // Create or update call record
    const call = await Call.findOneAndUpdate(
      { callId: callData.callId },
      callData,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    logger.info(`Processed Vicidial call: ${call.callId}`, {
      campaign: call.campaign,
      disposition: call.disposition,
      isSale: call.isSale
    });

    // Trigger AI processing for completed calls with recordings
    if (call.audioFilePath && call.status === 'completed') {
      try {
        // Queue for AI processing
        await aiService.processCall(call.callId);
        logger.info(`Queued call ${call.callId} for AI processing`);
      } catch (aiError) {
        logger.error(`Failed to queue AI processing for call ${call.callId}:`, aiError);
        // Don't fail the webhook, just log the error
      }
    }

    res.status(200).json({
      success: true,
      callId: call.callId,
      message: 'Call data processed successfully'
    });

  } catch (error) {
    logger.error('Error processing Vicidial webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process call data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Handle Vicidial agent status update webhook
 * @route   POST /api/webhooks/vicidial/agent-status
 * @access  Public
 */
exports.handleAgentStatusUpdate = async (req, res) => {
  try {
    const { user, status, campaign_id } = req.body;

    logger.info('Received Vicidial agent status update', {
      user,
      status,
      campaign: campaign_id
    });

    // Update agent status in your User model (if you add status fields)
    // This would require extending your User model with status fields

    res.status(200).json({
      success: true,
      message: 'Agent status updated'
    });

  } catch (error) {
    logger.error('Error processing agent status webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process agent status'
    });
  }
};

/**
 * Handle Vicidial lead update webhook
 * @route   POST /api/webhooks/vicidial/lead-update
 * @access  Public
 */
exports.handleLeadUpdate = async (req, res) => {
  try {
    const leadData = req.body;

    logger.info('Received Vicidial lead update', {
      lead_id: leadData.lead_id,
      status: leadData.status
    });

    // Update lead information if needed
    // This could update customer data in your Call records

    res.status(200).json({
      success: true,
      message: 'Lead data updated'
    });

  } catch (error) {
    logger.error('Error processing lead update webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process lead update'
    });
  }
};

/**
 * Get Vicidial system health/status
 * @route   GET /api/webhooks/vicidial/health
 * @access  Private
 */
exports.getVicidialHealth = async (req, res) => {
  try {
    const VicidialService = require('../services/vicidialService');
    const vicidialService = new VicidialService();

    const isConnected = await vicidialService.testConnection();
    await vicidialService.disconnect();

    res.status(200).json({
      success: true,
      vicidial: {
        connected: isConnected,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error checking Vicidial health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Vicidial health',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};