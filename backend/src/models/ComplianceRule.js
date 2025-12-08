const mongoose = require('mongoose');

const complianceRuleSchema = new mongoose.Schema(
  {
    campaign: {
      type: String,
      required: true,
      trim: true,
    },
    ruleType: {
      type: String,
      enum: ['mandatory', 'forbidden'],
      required: true,
    },
    phrase: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // For fuzzy matching tolerance (0 = exact match, higher = more tolerance)
    fuzzyTolerance: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    weight: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
complianceRuleSchema.index({ campaign: 1, isActive: 1 });
complianceRuleSchema.index({ ruleType: 1 });

module.exports = mongoose.model('ComplianceRule', complianceRuleSchema);
