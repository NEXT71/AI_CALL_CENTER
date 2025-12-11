const AuditLog = require('../models/AuditLog');

/**
 * @route   GET /api/audit-logs
 * @desc    Get all audit logs with filters
 * @access  Private (Admin only)
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      userId,
      action,
      resourceType,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    // Build query
    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/audit-logs/user/:userId
 * @desc    Get audit logs for specific user
 * @access  Private (Admin or own logs)
 */
exports.getUserAuditLogs = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if admin or viewing own logs
    if (req.user.role !== 'Admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these logs',
      });
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      AuditLog.countDocuments({ userId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/audit-logs/stats
 * @desc    Get audit log statistics
 * @access  Private (Admin only)
 */
exports.getAuditStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const [actionStats, statusStats, userStats, totalLogs] = await Promise.all([
      // Group by action
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Group by status
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Top users by activity
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            userId: '$_id',
            userName: '$user.name',
            userEmail: '$user.email',
            count: 1,
          },
        },
      ]),

      // Total logs
      AuditLog.countDocuments(dateFilter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalLogs,
        actionStats,
        statusStats,
        topUsers: userStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/audit-logs/resource/:resourceType/:resourceId
 * @desc    Get audit logs for specific resource
 * @access  Private
 */
exports.getResourceAuditLogs = async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({ resourceType, resourceId })
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      AuditLog.countDocuments({ resourceType, resourceId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
