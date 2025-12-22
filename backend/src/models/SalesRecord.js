const mongoose = require('mongoose');

const salesRecordSchema = new mongoose.Schema(
  {
    // Agent Information
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agentName: {
      type: String,
      required: true,
      trim: true,
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
    
    // Sales Metrics
    totalCalls: {
      type: Number,
      required: true,
      min: 0,
    },
    successfulSales: {
      type: Number,
      required: true,
      min: 0,
    },
    failedSales: {
      type: Number,
      required: true,
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
      enum: ['Admin', 'QA'],
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

// Calculate success rate before saving
salesRecordSchema.pre('save', function (next) {
  if (this.totalCalls > 0) {
    this.successRate = ((this.successfulSales / this.totalCalls) * 100).toFixed(2);
  } else {
    this.successRate = 0;
  }
  next();
});

// Indexes for efficient querying
salesRecordSchema.index({ agentId: 1, salesDate: -1 });
salesRecordSchema.index({ campaign: 1 });
salesRecordSchema.index({ submittedBy: 1 });
salesRecordSchema.index({ salesDate: -1 });
salesRecordSchema.index({ status: 1 });
salesRecordSchema.index({ successRate: -1 });
// Compound indexes
salesRecordSchema.index({ campaign: 1, salesDate: -1 });
salesRecordSchema.index({ agentId: 1, campaign: 1, salesDate: -1 });

module.exports = mongoose.model('SalesRecord', salesRecordSchema);
