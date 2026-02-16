const Call = require('../models/Call');
const coachingService = require('../services/coachingService');
const logger = require('../config/logger');

/**
 * @route   POST /api/coaching/generate/:callId
 * @desc    Generate AI coaching recommendations for a specific call
 * @access  Private (Admin, User)
 */
exports.generateCoaching = async (req, res, next) => {
  try {
    const { callId } = req.params;
    
    // Find the call
    const call = await Call.findById(callId);
    
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }
    
    // Check if call is processed
    if (call.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Call must be processed before generating coaching recommendations',
      });
    }
    
    // Generate coaching recommendations
    const coaching = coachingService.generateCoachingRecommendations(call);
    
    // Save to database
    call.coaching = coaching;
    await call.save();
    
    logger.info('Coaching recommendations generated', {
      callId: call.callId,
      userId: req.user.id,
    });
    
    res.status(200).json({
      success: true,
      message: 'Coaching recommendations generated successfully',
      data: coaching,
    });
    
  } catch (error) {
    logger.error('Generate coaching error', {
      error: error.message,
      callId: req.params.callId,
    });
    next(error);
  }
};

/**
 * @route   GET /api/coaching/:callId
 * @desc    Get coaching recommendations for a specific call
 * @access  Private (Admin, User)
 */
exports.getCoaching = async (req, res, next) => {
  try {
    const { callId } = req.params;
    
    const call = await Call.findById(callId).select('callId coaching');
    
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }
    
    if (!call.coaching) {
      return res.status(404).json({
        success: false,
        message: 'No coaching recommendations found for this call. Generate them first.',
      });
    }
    
    res.status(200).json({
      success: true,
      data: call.coaching,
    });
    
  } catch (error) {
    logger.error('Get coaching error', {
      error: error.message,
      callId: req.params.callId,
    });
    next(error);
  }
};

/**
 * @route   PUT /api/coaching/:callId/manager-notes
 * @desc    Update manager notes for coaching recommendations
 * @access  Private (Admin, User)
 */
exports.updateManagerNotes = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const { managerNotes } = req.body;
    
    const call = await Call.findById(callId);
    
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }
    
    if (!call.coaching) {
      return res.status(404).json({
        success: false,
        message: 'No coaching recommendations found for this call',
      });
    }
    
    // Update manager notes
    call.coaching = coachingService.updateManagerNotes(call.coaching, managerNotes);
    await call.save();
    
    logger.info('Manager notes updated', {
      callId: call.callId,
      userId: req.user.id,
    });
    
    res.status(200).json({
      success: true,
      message: 'Manager notes updated successfully',
      data: call.coaching,
    });
    
  } catch (error) {
    logger.error('Update manager notes error', {
      error: error.message,
      callId: req.params.callId,
    });
    next(error);
  }
};

/**
 * @route   GET /api/coaching/stats/agent/:agentId
 * @desc    Get coaching statistics for a specific agent
 * @access  Private (Admin, User)
 */
exports.getAgentCoachingStats = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Build query
    const query = { 
      agentId,
      coaching: { $exists: true },
    };
    
    if (startDate || endDate) {
      query.callDate = {};
      if (startDate) query.callDate.$gte = new Date(startDate);
      if (endDate) query.callDate.$lte = new Date(endDate);
    }
    
    const calls = await Call.find(query).sort({ callDate: -1 });
    
    const stats = coachingService.getCoachingStats(calls);
    
    res.status(200).json({
      success: true,
      data: stats,
    });
    
  } catch (error) {
    logger.error('Get agent coaching stats error', {
      error: error.message,
      agentId: req.params.agentId,
    });
    next(error);
  }
};

/**
 * @route   GET /api/coaching/stats/company
 * @desc    Get coaching statistics for the company
 * @access  Private (Admin, User)
 */
exports.getCompanyCoachingStats = async (req, res, next) => {
  try {
    const { startDate, endDate, campaign } = req.query;
    
    // Build query based on user role
    const query = {
      coaching: { $exists: true },
    };
    
    // If regular user, filter by their company
    if (req.user.role === 'user') {
      query.company = req.user.company;
    }
    
    if (campaign) {
      query.campaign = campaign;
    }
    
    if (startDate || endDate) {
      query.callDate = {};
      if (startDate) query.callDate.$gte = new Date(startDate);
      if (endDate) query.callDate.$lte = new Date(endDate);
    }
    
    const calls = await Call.find(query).sort({ callDate: -1 });
    
    const stats = coachingService.getCoachingStats(calls);
    
    res.status(200).json({
      success: true,
      data: stats,
    });
    
  } catch (error) {
    logger.error('Get company coaching stats error', {
      error: error.message,
    });
    next(error);
  }
};

/**
 * @route   DELETE /api/coaching/:callId
 * @desc    Delete coaching recommendations for a call
 * @access  Private (Admin only)
 */
exports.deleteCoaching = async (req, res, next) => {
  try {
    const { callId } = req.params;
    
    const call = await Call.findById(callId);
    
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }
    
    call.coaching = undefined;
    await call.save();
    
    logger.info('Coaching recommendations deleted', {
      callId: call.callId,
      userId: req.user.id,
    });
    
    res.status(200).json({
      success: true,
      message: 'Coaching recommendations deleted successfully',
    });
    
  } catch (error) {
    logger.error('Delete coaching error', {
      error: error.message,
      callId: req.params.callId,
    });
    next(error);
  }
};
