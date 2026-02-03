const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planType: {
      type: String,
      enum: ['starter', 'professional', 'enterprise'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'approved', 'rejected', 'refunded'],
      default: 'pending',
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'check', 'wire_transfer', 'cash', 'other'],
      required: true,
    },
    paymentDate: {
      type: Date,
    },
    paymentReference: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    // Payment proof documents
    proofDocuments: [{
      fileName: String,
      filePath: String,
      uploadedAt: Date,
    }],
    // Admin actions
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: Date,
    rejectionReason: String,
    // Invoice details
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    invoiceDate: Date,
    // Period covered
    subscriptionPeriodStart: Date,
    subscriptionPeriodEnd: Date,
    // Notes
    adminNotes: String,
    userNotes: String,
  },
  {
    timestamps: true,
  }
);

// Generate invoice number before saving
paymentSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'approved' && !this.invoiceNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(5, '0')}`;
    this.invoiceDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
