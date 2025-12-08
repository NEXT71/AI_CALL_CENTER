const ComplianceRule = require('../models/ComplianceRule');

/**
 * @route   POST /api/rules
 * @desc    Create compliance rule
 * @access  Private (Admin, Manager only)
 */
exports.createRule = async (req, res, next) => {
  try {
    const { campaign, ruleType, phrase, description, fuzzyTolerance, weight } = req.body;

    const rule = await ComplianceRule.create({
      campaign,
      ruleType,
      phrase,
      description,
      fuzzyTolerance,
      weight,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Compliance rule created successfully',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rules
 * @desc    Get all compliance rules
 * @access  Private
 */
exports.getRules = async (req, res, next) => {
  try {
    const { campaign, ruleType, isActive } = req.query;

    const query = {};
    if (campaign) query.campaign = campaign;
    if (ruleType) query.ruleType = ruleType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const rules = await ComplianceRule.find(query)
      .populate('createdBy', 'name email')
      .sort({ campaign: 1, ruleType: 1 });

    res.status(200).json({
      success: true,
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rules/:id
 * @desc    Get single compliance rule
 * @access  Private
 */
exports.getRuleById = async (req, res, next) => {
  try {
    const rule = await ComplianceRule.findById(req.params.id).populate('createdBy', 'name email');

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Compliance rule not found',
      });
    }

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/rules/:id
 * @desc    Update compliance rule
 * @access  Private (Admin, Manager only)
 */
exports.updateRule = async (req, res, next) => {
  try {
    const { campaign, ruleType, phrase, description, fuzzyTolerance, weight, isActive } = req.body;

    const rule = await ComplianceRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Compliance rule not found',
      });
    }

    // Update fields
    if (campaign !== undefined) rule.campaign = campaign;
    if (ruleType !== undefined) rule.ruleType = ruleType;
    if (phrase !== undefined) rule.phrase = phrase;
    if (description !== undefined) rule.description = description;
    if (fuzzyTolerance !== undefined) rule.fuzzyTolerance = fuzzyTolerance;
    if (weight !== undefined) rule.weight = weight;
    if (isActive !== undefined) rule.isActive = isActive;

    await rule.save();

    res.status(200).json({
      success: true,
      message: 'Compliance rule updated successfully',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/rules/:id
 * @desc    Delete compliance rule
 * @access  Private (Admin only)
 */
exports.deleteRule = async (req, res, next) => {
  try {
    const rule = await ComplianceRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Compliance rule not found',
      });
    }

    await rule.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Compliance rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rules/campaigns/list
 * @desc    Get list of unique campaigns
 * @access  Private
 */
exports.getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await ComplianceRule.distinct('campaign');

    res.status(200).json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    next(error);
  }
};
