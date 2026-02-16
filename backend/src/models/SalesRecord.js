const mongoose = require('mongoose');

const salesRecordSchema = new mongoose.Schema(
  {
    // Record Type
    recordType: {
      type: String,
      enum: ['agent', 'office'],
      required: true,
      default: 'agent',
    },
    
    // Agent Information (required for agent records)
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Made optional to allow direct agentName entry
    },
    agentName: {
      type: String,
      required: function() { return this.recordType === 'agent'; },
      trim: true,
    },
    
    // Office Information (required for office records)
    officeRevenue: {
      type: Number,
      required: function() { return this.recordType === 'office'; },
      min: 0,
    },
    officeTargets: {
      type: Number,
      required: function() { return this.recordType === 'office'; },
      min: 0,
    },
    officeNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    
    campaign: {
      type: String,
      required: true,
      trim: true,
    },
    salesDate: {
      type: Date,
      required: true,
    },
    
    // Sales Metrics (required for agent records)
    totalCalls: {
      type: Number,
      required: function() { return this.recordType === 'agent'; },
      min: 0,
    },
    successfulSales: {
      type: Number,
      required: function() { return this.recordType === 'agent'; },
      min: 0,
    },
    failedSales: {
      type: Number,
      required: function() { return this.recordType === 'agent'; },
      min: 0,
    },
    warmTransfers: {
      type: Number,
      default: 0,
      min: 0,
    },
    callbacksScheduled: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Additional Information
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    
    // Submission Info
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submittedByName: {
      type: String,
      required: true,
    },
    submittedByRole: {
      type: String,
      enum: ['Admin', 'User', 'QA'],
      required: true,
    },
    
    // QA Validation
    qaReview: {
      reviewerName: {
        type: String,
        trim: true,
      },
      verified: {
        type: Boolean,
        default: null,
      },
      comments: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      reviewedAt: {
        type: Date,
      },
    },
    
    // Calculated Fields
    successRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'verified', 'flagged'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate success rate before saving (only for agent records)
salesRecordSchema.pre('save', function (next) {
  if (this.recordType === 'agent' && this.totalCalls > 0) {
    this.successRate = ((this.successfulSales / this.totalCalls) * 100).toFixed(2);
  } else if (this.recordType === 'agent') {
    this.successRate = 0;
  }
  next();
});

// Indexes for efficient querying
salesRecordSchema.index({ agentId: 1, salesDate: -1 });
salesRecordSchema.index({ recordType: 1, salesDate: -1 });
salesRecordSchema.index({ campaign: 1 });
salesRecordSchema.index({ submittedBy: 1 });
salesRecordSchema.index({ salesDate: -1 });
salesRecordSchema.index({ status: 1 });
salesRecordSchema.index({ successRate: -1 });
// Compound indexes
salesRecordSchema.index({ campaign: 1, salesDate: -1 });
salesRecordSchema.index({ agentId: 1, campaign: 1, salesDate: -1 });
salesRecordSchema.index({ recordType: 1, campaign: 1, salesDate: -1 });

// Unique index to prevent duplicate entries for agent records
salesRecordSchema.index(
  { agentId: 1, salesDate: 1, campaign: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { recordType: 'agent' }
  }
);

// Unique index to prevent duplicate office entries for same date and campaign
salesRecordSchema.index(
  { salesDate: 1, campaign: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { recordType: 'office' }
  }
);

module.exports = mongoose.model('SalesRecord', salesRecordSchema);
