const Call = require('../models/Call');
const logger = require('../config/logger');

// Plan limits configuration
const PLAN_LIMITS = {
  free: {
    callsPerMonth: 10,
    storageGB: 1,
    dataRetentionDays: 7,
    teamMembers: 1,
  },
  starter: {
    callsPerMonth: 100,
    storageGB: 10,
    dataRetentionDays: 30,
    teamMembers: 3,
  },
  professional: {
    callsPerMonth: 500,
    storageGB: 50,
    dataRetentionDays: 90,
    teamMembers: 5,
  },
  enterprise: {
    callsPerMonth: -1, // Unlimited
    storageGB: -1, // Unlimited
    dataRetentionDays: 365,
    teamMembers: -1, // Unlimited
  },
};

/**
 * Check if user has exceeded their monthly call limit
 */
exports.checkCallLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const plan = user.subscription?.plan || 'free';
    const limits = PLAN_LIMITS[plan];

    // If unlimited (enterprise), skip check
    if (limits.callsPerMonth === -1) {
      return next();
    }

    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count calls uploaded this month by this user
    const callCount = await Call.countDocuments({
      uploadedBy: user._id,
      createdAt: { $gte: startOfMonth },
    });

    // Check if limit exceeded
    if (callCount >= limits.callsPerMonth) {
      return res.status(402).json({
        success: false,
        message: `You have reached your monthly limit of ${limits.callsPerMonth} calls. Please upgrade your plan to continue.`,
        limitExceeded: true,
        currentUsage: callCount,
        limit: limits.callsPerMonth,
        plan,
      });
    }

    // Add usage info to request for logging
    req.usageInfo = {
      currentUsage: callCount,
      limit: limits.callsPerMonth,
      remaining: limits.callsPerMonth - callCount,
    };

    next();
  } catch (error) {
    logger.error('Error checking call limit:', error);
    // Don't block on error, just log and continue
    next();
  }
};

/**
 * Get current usage statistics for a user
 */
exports.getUsageStats = async (userId, plan) => {
  try {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count calls this month
    const callsThisMonth = await Call.countDocuments({
      uploadedBy: userId,
      createdAt: { $gte: startOfMonth },
    });

    // Calculate storage used (sum of file sizes)
    const storageResult = await Call.aggregate([
      {
        $match: {
          uploadedBy: userId,
        },
      },
      {
        $group: {
          _id: null,
          totalStorage: { $sum: '$fileSize' },
        },
      },
    ]);

    const storageUsedBytes = storageResult.length > 0 ? storageResult[0].totalStorage : 0;
    const storageUsedGB = storageUsedBytes / (1024 * 1024 * 1024);

    return {
      calls: {
        used: callsThisMonth,
        limit: limits.callsPerMonth,
        remaining: limits.callsPerMonth === -1 ? -1 : Math.max(0, limits.callsPerMonth - callsThisMonth),
        unlimited: limits.callsPerMonth === -1,
      },
      storage: {
        usedGB: parseFloat(storageUsedGB.toFixed(2)),
        limitGB: limits.storageGB,
        remainingGB: limits.storageGB === -1 ? -1 : parseFloat(Math.max(0, limits.storageGB - storageUsedGB).toFixed(2)),
        unlimited: limits.storageGB === -1,
      },
      plan,
    };
  } catch (error) {
    logger.error('Error getting usage stats:', error);
    return null;
  }
};

module.exports.PLAN_LIMITS = PLAN_LIMITS;
