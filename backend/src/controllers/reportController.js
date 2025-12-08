const Call = require('../models/Call');

/**
 * @route   GET /api/reports/:callId
 * @desc    Generate call quality report
 * @access  Private
 */
exports.getCallReport = async (req, res, next) => {
  try {
    const call = await Call.findById(req.params.callId)
      .populate('agentId', 'name email department')
      .populate('uploadedBy', 'name email')
      .populate('reviewedBy', 'name email');

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    // Role-based access control
    if (req.user.role === 'Agent' && call.agentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this report',
      });
    }

    // Generate report structure
    const report = {
      reportId: `REPORT-${call.callId}`,
      generatedAt: new Date(),
      generatedBy: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
      
      // Call Information
      callInfo: {
        callId: call.callId,
        callDate: call.callDate,
        duration: call.duration,
        campaign: call.campaign,
        agent: {
          id: call.agentId._id,
          name: call.agentId.name,
          email: call.agentId.email,
          department: call.agentId.department,
        },
        customer: {
          id: call.customerId,
          name: call.customerName,
        },
      },

      // Scores
      scores: {
        quality: {
          score: call.qualityScore,
          rating: getScoreRating(call.qualityScore),
        },
        compliance: {
          score: call.complianceScore,
          rating: getScoreRating(call.complianceScore),
        },
        sentiment: {
          label: call.sentiment,
          score: call.sentimentScore,
        },
      },

      // Quality Metrics
      qualityMetrics: call.qualityMetrics,

      // Compliance Details
      complianceDetails: {
        missingMandatoryPhrases: call.missingMandatoryPhrases,
        detectedForbiddenPhrases: call.detectedForbiddenPhrases,
        violations: call.detectedForbiddenPhrases.length,
      },

      // Transcript
      transcript: call.transcript,

      // Recommendations
      recommendations: generateRecommendations(call),

      // Metadata
      metadata: {
        uploadedBy: call.uploadedBy,
        uploadedAt: call.createdAt,
        reviewedBy: call.reviewedBy,
        reviewedAt: call.reviewedAt,
        status: call.status,
        notes: call.notes,
      },
    };

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports/analytics/summary
 * @desc    Get analytics summary
 * @access  Private (Admin, Manager, QA)
 */
exports.getAnalyticsSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, campaign, agentId } = req.query;

    // Build query
    const query = { status: 'completed' };

    if (startDate || endDate) {
      query.callDate = {};
      if (startDate) query.callDate.$gte = new Date(startDate);
      if (endDate) query.callDate.$lte = new Date(endDate);
    }

    if (campaign) query.campaign = campaign;
    if (agentId) query.agentId = agentId;

    // Get all calls matching criteria
    const calls = await Call.find(query);

    if (calls.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalCalls: 0,
          message: 'No calls found for the specified criteria',
        },
      });
    }

    // Calculate statistics
    const totalCalls = calls.length;
    const avgQualityScore = calls.reduce((sum, call) => sum + call.qualityScore, 0) / totalCalls;
    const avgComplianceScore = calls.reduce((sum, call) => sum + call.complianceScore, 0) / totalCalls;

    // Sentiment distribution
    const sentimentCounts = calls.reduce((acc, call) => {
      acc[call.sentiment] = (acc[call.sentiment] || 0) + 1;
      return acc;
    }, {});

    // Score distribution
    const scoreRanges = {
      excellent: calls.filter(c => c.qualityScore >= 90).length,
      good: calls.filter(c => c.qualityScore >= 70 && c.qualityScore < 90).length,
      fair: calls.filter(c => c.qualityScore >= 50 && c.qualityScore < 70).length,
      poor: calls.filter(c => c.qualityScore < 50).length,
    };

    // Compliance issues
    const totalViolations = calls.reduce((sum, call) => 
      sum + call.detectedForbiddenPhrases.length, 0
    );
    const callsWithViolations = calls.filter(c => c.detectedForbiddenPhrases.length > 0).length;

    // Top issues
    const allMissingPhrases = calls.flatMap(c => c.missingMandatoryPhrases);
    const phraseCounts = allMissingPhrases.reduce((acc, phrase) => {
      acc[phrase] = (acc[phrase] || 0) + 1;
      return acc;
    }, {});
    const topMissingPhrases = Object.entries(phraseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase, count]) => ({ phrase, count }));

    const summary = {
      period: {
        startDate: startDate || calls[calls.length - 1].callDate,
        endDate: endDate || calls[0].callDate,
      },
      filters: { campaign, agentId },
      
      overview: {
        totalCalls,
        avgQualityScore: Math.round(avgQualityScore * 100) / 100,
        avgComplianceScore: Math.round(avgComplianceScore * 100) / 100,
        totalDuration: calls.reduce((sum, call) => sum + call.duration, 0),
      },

      sentiment: {
        distribution: sentimentCounts,
        percentages: Object.entries(sentimentCounts).reduce((acc, [key, val]) => {
          acc[key] = Math.round((val / totalCalls) * 100);
          return acc;
        }, {}),
      },

      qualityDistribution: {
        counts: scoreRanges,
        percentages: {
          excellent: Math.round((scoreRanges.excellent / totalCalls) * 100),
          good: Math.round((scoreRanges.good / totalCalls) * 100),
          fair: Math.round((scoreRanges.fair / totalCalls) * 100),
          poor: Math.round((scoreRanges.poor / totalCalls) * 100),
        },
      },

      compliance: {
        totalViolations,
        callsWithViolations,
        violationRate: Math.round((callsWithViolations / totalCalls) * 100),
        topMissingPhrases,
      },
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to get score rating
 */
function getScoreRating(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

/**
 * Generate recommendations based on call analysis
 */
function generateRecommendations(call) {
  const recommendations = [];

  // Quality recommendations
  if (!call.qualityMetrics.hasGreeting) {
    recommendations.push({
      category: 'Quality',
      priority: 'High',
      issue: 'Missing greeting',
      suggestion: 'Agent should always start the call with a proper greeting',
    });
  }

  if (!call.qualityMetrics.hasProperClosing) {
    recommendations.push({
      category: 'Quality',
      priority: 'Medium',
      issue: 'Missing proper closing',
      suggestion: 'Agent should end calls professionally with a proper closing statement',
    });
  }

  if (call.qualityMetrics.agentInterruptionCount > 3) {
    recommendations.push({
      category: 'Quality',
      priority: 'Medium',
      issue: 'Excessive interruptions',
      suggestion: 'Agent should practice active listening and avoid interrupting the customer',
    });
  }

  // Compliance recommendations
  if (call.missingMandatoryPhrases.length > 0) {
    recommendations.push({
      category: 'Compliance',
      priority: 'High',
      issue: `Missing ${call.missingMandatoryPhrases.length} mandatory phrase(s)`,
      suggestion: 'Agent must use all required compliance phrases in every call',
      details: call.missingMandatoryPhrases,
    });
  }

  if (call.detectedForbiddenPhrases.length > 0) {
    recommendations.push({
      category: 'Compliance',
      priority: 'Critical',
      issue: 'Forbidden phrases detected',
      suggestion: 'Agent must avoid using prohibited language or phrases',
      details: call.detectedForbiddenPhrases,
    });
  }

  // Sentiment recommendations
  if (call.sentiment === 'negative') {
    recommendations.push({
      category: 'Customer Satisfaction',
      priority: 'High',
      issue: 'Negative call sentiment detected',
      suggestion: 'Review call for customer pain points and areas of improvement',
    });
  }

  // Score-based recommendations
  if (call.qualityScore < 70) {
    recommendations.push({
      category: 'Training',
      priority: 'High',
      issue: 'Low quality score',
      suggestion: 'Agent may benefit from additional training and coaching',
    });
  }

  return recommendations;
}
