const SalesRecord = require('../models/SalesRecord');
const User = require('../models/User');
const logger = require('../config/logger');
const { AppError } = require('../utils/errors');

/**
 * Create new sales record (QA & Admin only)
 */
exports.createSalesRecord = async (req, res, next) => {
  try {
    const {
      recordType = 'agent',
      agentId,
      agentName,
      campaign,
      salesDate,
      totalCalls,
      successfulSales,
      failedSales,
      warmTransfers,
      callbacksScheduled,
      notes,
      officeRevenue,
      officeTargets,
      officeNotes,
    } = req.body;

    let salesRecordData = {
      recordType,
      campaign,
      salesDate,
      notes,
      submittedBy: req.user._id,
      submittedByName: req.user.name,
      submittedByRole: req.user.role,
    };

    if (recordType === 'agent') {
      // Handle agent name - can be provided directly or looked up via agentId
      let finalAgentName = agentName;
      let finalAgentId = agentId;

      if (agentId && !agentName) {
        // If only agentId provided, lookup the agent
        const agent = await User.findById(agentId);
        if (!agent) {
          throw new AppError('Agent not found', 404);
        }
        finalAgentName = agent.name;
      } else if (!agentName) {
        // Neither agentId nor agentName provided
        throw new AppError('Agent name is required', 400);
      }

      // Add agent-specific fields
      if (finalAgentId) {
        salesRecordData.agentId = finalAgentId;
      }
      salesRecordData.agentName = finalAgentName;
      salesRecordData.totalCalls = totalCalls;
      salesRecordData.successfulSales = successfulSales;
      salesRecordData.failedSales = failedSales;
      salesRecordData.warmTransfers = warmTransfers || 0;
      salesRecordData.callbacksScheduled = callbacksScheduled || 0;
    } else if (recordType === 'office') {
      // Add office-specific fields
      salesRecordData.officeRevenue = officeRevenue;
      salesRecordData.officeTargets = officeTargets;
      salesRecordData.officeNotes = officeNotes;
    } else {
      throw new AppError('Invalid record type. Must be "agent" or "office"', 400);
    }

    // Create sales record
    const salesRecord = await SalesRecord.create(salesRecordData);

    logger.info('Sales record created', {
      salesRecordId: salesRecord._id,
      recordType,
      agentId: recordType === 'agent' ? agentId : undefined,
      submittedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: salesRecord,
    });
  } catch (error) {
    logger.error('Error creating sales record', { error: error.message });
    next(error);
  }
};

/**
 * Get all sales records (with filters and pagination)
 */
exports.getSalesRecords = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      agentId,
      campaign,
      startDate,
      endDate,
      status,
      submittedBy,
      sortBy = 'salesDate',
      sortOrder = 'desc',
    } = req.query;

    // Build filter query
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'QA') {
      // QA can only see their own submissions
      filter.submittedBy = req.user._id;
    }
    // Admin and Manager can see all records

    if (agentId) filter.agentId = agentId;
    if (campaign) filter.campaign = campaign;
    if (status) filter.status = status;
    if (submittedBy) filter.submittedBy = submittedBy;

    // Date range filter
    if (startDate || endDate) {
      filter.salesDate = {};
      if (startDate) filter.salesDate.$gte = new Date(startDate);
      if (endDate) filter.salesDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query
    const [salesRecords, total] = await Promise.all([
      SalesRecord.find(filter)
        .populate('agentId', 'name email role')
        .populate('submittedBy', 'name role')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      SalesRecord.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: salesRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        recordsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching sales records', { error: error.message });
    next(error);
  }
};

/**
 * Get single sales record by ID
 */
exports.getSalesRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const salesRecord = await SalesRecord.findById(id)
      .populate('agentId', 'name email role department')
      .populate('submittedBy', 'name role');

    if (!salesRecord) {
      throw new AppError('Sales record not found', 404);
    }

    // Permission check: QA can only view their own submissions
    if (req.user.role === 'QA' && salesRecord.submittedBy._id.toString() !== req.user._id.toString()) {
      throw new AppError('Access denied', 403);
    }

    res.json({
      success: true,
      data: salesRecord,
    });
  } catch (error) {
    logger.error('Error fetching sales record', { error: error.message, id: req.params.id });
    next(error);
  }
};

/**
 * Update sales record (QA can only update their own)
 */
exports.updateSalesRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const salesRecord = await SalesRecord.findById(id);

    if (!salesRecord) {
      throw new AppError('Sales record not found', 404);
    }

    // Permission check: QA can only edit their own submissions
    if (req.user.role === 'QA' && salesRecord.submittedBy.toString() !== req.user._id.toString()) {
      throw new AppError('Access denied - you can only edit your own submissions', 403);
    }

    // Update allowed fields based on record type
    let allowedUpdates = [
      'campaign',
      'salesDate',
      'notes',
    ];

    if (salesRecord.recordType === 'agent') {
      allowedUpdates.push(
        'totalCalls',
        'successfulSales',
        'failedSales',
        'warmTransfers',
        'callbacksScheduled'
      );
    } else if (salesRecord.recordType === 'office') {
      allowedUpdates.push(
        'officeRevenue',
        'officeTargets',
        'officeNotes'
      );
    }

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        salesRecord[field] = updates[field];
      }
    });

    await salesRecord.save();

    logger.info('Sales record updated', {
      salesRecordId: id,
      updatedBy: req.user._id,
    });

    res.json({
      success: true,
      data: salesRecord,
    });
  } catch (error) {
    logger.error('Error updating sales record', { error: error.message, id: req.params.id });
    next(error);
  }
};

/**
 * Add QA review to sales record
 */
exports.addQAReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verified, comments } = req.body;

    const salesRecord = await SalesRecord.findById(id);

    if (!salesRecord) {
      throw new AppError('Sales record not found', 404);
    }

    // Update QA review
    salesRecord.qaReview = {
      reviewerName: req.user.name,
      verified,
      comments,
      reviewedAt: new Date(),
    };

    salesRecord.status = verified ? 'verified' : 'flagged';

    await salesRecord.save();

    logger.info('QA review added', {
      salesRecordId: id,
      reviewedBy: req.user._id,
      verified,
    });

    res.json({
      success: true,
      data: salesRecord,
    });
  } catch (error) {
    logger.error('Error adding QA review', { error: error.message, id: req.params.id });
    next(error);
  }
};

/**
 * Delete sales record (Admin only)
 */
exports.deleteSalesRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const salesRecord = await SalesRecord.findByIdAndDelete(id);

    if (!salesRecord) {
      throw new AppError('Sales record not found', 404);
    }

    logger.info('Sales record deleted', {
      salesRecordId: id,
      deletedBy: req.user._id,
    });

    res.json({
      success: true,
      message: 'Sales record deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting sales record', { error: error.message, id: req.params.id });
    next(error);
  }
};

/**
 * Get sales analytics and reports
 */
exports.getSalesAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, campaign, agentId } = req.query;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.salesDate = {};
      if (startDate) filter.salesDate.$gte = new Date(startDate);
      if (endDate) filter.salesDate.$lte = new Date(endDate);
    }
    if (campaign) filter.campaign = campaign;
    if (agentId) filter.agentId = agentId;

    // Aggregate analytics
    const [
      totalStats,
      salesByDate,
      salesByCampaign,
      topAgents,
      recentRecords,
    ] = await Promise.all([
      // Total statistics
      SalesRecord.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            totalCalls: { $sum: '$totalCalls' },
            totalSuccessfulSales: { $sum: '$successfulSales' },
            totalFailedSales: { $sum: '$failedSales' },
            totalWarmTransfers: { $sum: '$warmTransfers' },
            totalCallbacks: { $sum: '$callbacksScheduled' },
            avgSuccessRate: { $avg: '$successRate' },
          },
        },
      ]),

      // Sales by date (trend)
      SalesRecord.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$salesDate' } },
            totalSales: { $sum: '$successfulSales' },
            totalCalls: { $sum: '$totalCalls' },
            recordCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),

      // Sales by campaign
      SalesRecord.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$campaign',
            totalSales: { $sum: '$successfulSales' },
            totalCalls: { $sum: '$totalCalls' },
            avgSuccessRate: { $avg: '$successRate' },
            recordCount: { $sum: 1 },
          },
        },
        { $sort: { totalSales: -1 } },
      ]),

      // Top performing agents
      SalesRecord.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$agentId',
            agentName: { $first: '$agentName' },
            totalSales: { $sum: '$successfulSales' },
            totalCalls: { $sum: '$totalCalls' },
            avgSuccessRate: { $avg: '$successRate' },
          },
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
      ]),

      // Recent records
      SalesRecord.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('agentId', 'name')
        .select('agentName campaign successfulSales totalCalls successRate salesDate'),
    ]);

    res.json({
      success: true,
      data: {
        summary: totalStats[0] || {
          totalRecords: 0,
          totalCalls: 0,
          totalSuccessfulSales: 0,
          totalFailedSales: 0,
          totalWarmTransfers: 0,
          totalCallbacks: 0,
          avgSuccessRate: 0,
        },
        salesByDate,
        salesByCampaign,
        topAgents,
        recentRecords,
      },
    });
  } catch (error) {
    logger.error('Error fetching sales analytics', { error: error.message });
    next(error);
  }
};

/**
 * Get unique campaigns for dropdown
 */
exports.getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await SalesRecord.distinct('campaign');
    
    res.json({
      success: true,
      data: campaigns.sort(),
    });
  } catch (error) {
    logger.error('Error fetching campaigns', { error: error.message });
    next(error);
  }
};

/**
 * Export sales data to CSV
 */
exports.exportSalesData = async (req, res, next) => {
  try {
    const { startDate, endDate, campaign, agentId } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.salesDate = {};
      if (startDate) filter.salesDate.$gte = new Date(startDate);
      if (endDate) filter.salesDate.$lte = new Date(endDate);
    }
    if (campaign) filter.campaign = campaign;
    if (agentId) filter.agentId = agentId;

    const salesRecords = await SalesRecord.find(filter)
      .populate('agentId', 'name email')
      .sort({ salesDate: -1 });

    // Convert to CSV format
    const csvHeaders = [
      'Date',
      'Agent Name',
      'Campaign',
      'Total Calls',
      'Successful Sales',
      'Failed Sales',
      'Warm Transfers',
      'Callbacks',
      'Success Rate (%)',
      'Submitted By',
      'Status',
    ].join(',');

    const csvRows = salesRecords.map((record) => {
      return [
        new Date(record.salesDate).toLocaleDateString(),
        record.agentName,
        record.campaign,
        record.totalCalls,
        record.successfulSales,
        record.failedSales,
        record.warmTransfers,
        record.callbacksScheduled,
        record.successRate,
        record.submittedByName,
        record.status,
      ].join(',');
    });

    const csv = [csvHeaders, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales-data-${Date.now()}.csv`);
    res.send(csv);

    logger.info('Sales data exported', { userId: req.user._id, recordCount: salesRecords.length });
  } catch (error) {
    logger.error('Error exporting sales data', { error: error.message });
    next(error);
  }
};
