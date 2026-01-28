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
        agent: call.agentId ? {
          id: call.agentId._id,
          name: call.agentId.name,
          email: call.agentId.email,
          department: call.agentId.department,
        } : {
          id: null,
          name: call.agentName || 'Unknown',
          email: null,
          department: null,
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

/**
 * @route   GET /api/reports/sales/summary
 * @desc    Get sales summary analytics
 * @access  Private (Admin, Manager, QA)
 */
exports.getSalesSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, campaign } = req.query;

    // Build query for sale calls only
    const match = { isSale: true, status: 'completed' };
    
    if (startDate || endDate) {
      match.callDate = {};
      if (startDate) match.callDate.$gte = new Date(startDate);
      if (endDate) match.callDate.$lte = new Date(endDate);
    }
    
    if (campaign) match.campaign = campaign;

    const summary = await Call.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$saleAmount' },
          avgSaleAmount: { $avg: '$saleAmount' },
          avgQualityScore: { $avg: '$qualityScore' },
          avgComplianceScore: { $avg: '$complianceScore' },
          minSaleAmount: { $min: '$saleAmount' },
          maxSaleAmount: { $max: '$saleAmount' },
        },
      },
    ]);

    const result = summary[0] || {
      totalSales: 0,
      totalRevenue: 0,
      avgSaleAmount: 0,
      avgQualityScore: 0,
      avgComplianceScore: 0,
      minSaleAmount: 0,
      maxSaleAmount: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        ...result,
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
        filters: { campaign },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports/sales/by-agent
 * @desc    Get sales performance by agent
 * @access  Private (Admin, Manager, QA)
 */
exports.getSalesByAgent = async (req, res, next) => {
  try {
    const { startDate, endDate, campaign, limit = 20 } = req.query;

    const match = { isSale: true, status: 'completed' };
    
    if (startDate || endDate) {
      match.callDate = {};
      if (startDate) match.callDate.$gte = new Date(startDate);
      if (endDate) match.callDate.$lte = new Date(endDate);
    }
    
    if (campaign) match.campaign = campaign;

    const sales = await Call.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$agentId',
          agentName: { $first: '$agentName' },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$saleAmount' },
          avgSaleAmount: { $avg: '$saleAmount' },
          avgQualityScore: { $avg: '$qualityScore' },
          avgComplianceScore: { $avg: '$complianceScore' },
          maxSaleAmount: { $max: '$saleAmount' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.status(200).json({
      success: true,
      data: sales,
      count: sales.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports/sales/by-product
 * @desc    Get sales performance by product
 * @access  Private (Admin, Manager, QA)
 */
exports.getSalesByProduct = async (req, res, next) => {
  try {
    const { startDate, endDate, campaign } = req.query;

    const match = { 
      isSale: true, 
      status: 'completed', 
      productSold: { $ne: null, $ne: '' },
    };
    
    if (startDate || endDate) {
      match.callDate = {};
      if (startDate) match.callDate.$gte = new Date(startDate);
      if (endDate) match.callDate.$lte = new Date(endDate);
    }
    
    if (campaign) match.campaign = campaign;

    const products = await Call.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$productSold',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$saleAmount' },
          avgSaleAmount: { $avg: '$saleAmount' },
          avgQualityScore: { $avg: '$qualityScore' },
          avgComplianceScore: { $avg: '$complianceScore' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports/sales/best-calls
 * @desc    Get best sale calls for training
 * @access  Private (Admin, Manager, QA)
 */
exports.getBestSaleCalls = async (req, res, next) => {
  try {
    const { 
      limit = 10, 
      minQualityScore = 80,
      minComplianceScore = 80,
      campaign,
    } = req.query;

    const query = {
      isSale: true,
      status: 'completed',
      qualityScore: { $gte: parseFloat(minQualityScore) },
      complianceScore: { $gte: parseFloat(minComplianceScore) },
    };

    if (campaign) query.campaign = campaign;

    const bestCalls = await Call.find(query)
      .sort({ qualityScore: -1, complianceScore: -1, saleAmount: -1 })
      .limit(parseInt(limit))
      .select('callId agentName saleAmount productSold qualityScore complianceScore sentiment callDate campaign')
      .lean();

    res.status(200).json({
      success: true,
      data: bestCalls,
      count: bestCalls.length,
      criteria: {
        minQualityScore: parseFloat(minQualityScore),
        minComplianceScore: parseFloat(minComplianceScore),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports/system/summary
 * @desc    Get system overview and health metrics
 * @access  Private - Admin only
 */
exports.getSystemSummary = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const AuditLog = require('../models/AuditLog');
    const SalesRecord = require('../models/SalesRecord');

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'Admin' });
    const userUsers = await User.countDocuments({ role: 'User' });

    // Subscription statistics
    const subscriptionStats = await User.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      }
    ]);

    const subscriptionByStatus = await User.aggregate([
      {
        $group: {
          _id: '$subscription.status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentLogins = await AuditLog.countDocuments({
      action: 'LOGIN',
      timestamp: { $gte: thirtyDaysAgo }
    });

    const recentRegistrations = await AuditLog.countDocuments({
      action: 'USER_REGISTRATION',
      timestamp: { $gte: thirtyDaysAgo }
    });

    // Call statistics
    const totalCalls = await Call.countDocuments();
    const completedCalls = await Call.countDocuments({ status: 'completed' });
    const pendingCalls = await Call.countDocuments({ status: 'pending' });

    // Sales statistics
    const totalSales = await SalesRecord.countDocuments();
    const totalRevenue = await SalesRecord.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          byRole: {
            admin: adminUsers,
            user: userUsers
          }
        },
        subscriptions: {
          byPlan: subscriptionStats,
          byStatus: subscriptionByStatus
        },
        activity: {
          recentLogins,
          recentRegistrations,
          period: 'last 30 days'
        },
        calls: {
          total: totalCalls,
          completed: completedCalls,
          pending: pendingCalls,
          completionRate: totalCalls > 0 ? (completedCalls / totalCalls * 100).toFixed(1) : 0
        },
        sales: {
          totalRecords: totalSales,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports/system/user-activity
 * @desc    Get user activity and engagement metrics
 * @access  Private - Admin only
 */
exports.getUserActivityReport = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const AuditLog = require('../models/AuditLog');
    const { period = '30' } = req.query;
    
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // User login activity
    const loginActivity = await AuditLog.aggregate([
      {
        $match: {
          action: 'LOGIN',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            userId: '$userId',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id.userId',
          userName: '$user.name',
          userEmail: '$user.email',
          userRole: '$user.role',
          date: '$_id.date',
          loginCount: '$count'
        }
      },
      {
        $sort: { date: -1, loginCount: -1 }
      }
    ]);

    // Most active users
    const mostActiveUsers = await AuditLog.aggregate([
      {
        $match: {
          action: { $in: ['LOGIN', 'UPLOAD_CALL', 'VIEW_CALL', 'GENERATE_REPORT'] },
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          activityCount: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          userRole: '$user.role',
          activityCount: 1,
          lastActivity: 1
        }
      },
      {
        $sort: { activityCount: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Daily activity summary
    const dailyActivity = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            action: '$action'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1, '_id.action': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        loginActivity,
        mostActiveUsers,
        dailyActivity,
        period: `${days} days`,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports/system/subscription-analytics
 * @desc    Get subscription and revenue analytics
 * @access  Private - Admin only
 */
exports.getSubscriptionAnalytics = async (req, res, next) => {
  try {
    const User = require('../models/User');
    
    // Subscription distribution
    const subscriptionDistribution = await User.aggregate([
      {
        $group: {
          _id: {
            plan: '$subscription.plan',
            status: '$subscription.status'
          },
          count: { $sum: 1 },
          users: { $push: { name: '$name', email: '$email', createdAt: '$createdAt' } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Trial vs paid conversion
    const trialUsers = await User.countDocuments({ 'subscription.status': 'trial' });
    const paidUsers = await User.countDocuments({ 
      'subscription.status': 'active',
      'subscription.plan': { $ne: 'free' }
    });
    const conversionRate = trialUsers > 0 ? (paidUsers / (trialUsers + paidUsers) * 100).toFixed(1) : 0;

    // Revenue by plan (mock data - in real app, this would come from Stripe)
    const revenueByPlan = [
      { plan: 'starter', amount: 29, users: 0 },
      { plan: 'professional', amount: 79, users: 0 },
      { plan: 'enterprise', amount: 199, users: 0 }
    ];

    // Update with actual user counts
    subscriptionDistribution.forEach(dist => {
      const planRevenue = revenueByPlan.find(r => r.plan === dist._id.plan);
      if (planRevenue && dist._id.status === 'active') {
        planRevenue.users = dist.count;
      }
    });

    const totalRevenue = revenueByPlan.reduce((sum, plan) => sum + (plan.amount * plan.users), 0);

    // Churn analysis (users who cancelled or expired)
    const churnedUsers = await User.countDocuments({
      'subscription.status': { $in: ['cancelled', 'expired'] }
    });

    // Recent subscriptions (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSubscriptions = await User.find({
      'subscription.currentPeriodStart': { $gte: thirtyDaysAgo }
    }).select('name email subscription.plan subscription.status subscription.currentPeriodStart');

    res.status(200).json({
      success: true,
      data: {
        subscriptionDistribution,
        conversionMetrics: {
          trialUsers,
          paidUsers,
          conversionRate: parseFloat(conversionRate)
        },
        revenue: {
          byPlan: revenueByPlan,
          totalMonthly: totalRevenue,
          currency: 'USD'
        },
        churn: {
          churnedUsers,
          churnRate: totalRevenue > 0 ? (churnedUsers / (paidUsers + churnedUsers) * 100).toFixed(1) : 0
        },
        recentSubscriptions,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};
