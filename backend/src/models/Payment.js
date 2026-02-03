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
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
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
      default: 'other',
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

// Generate invoice number before saving with retry logic for race conditions
paymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}${month}-`;
    
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        // Find the highest invoice number for this month
        const lastInvoice = await mongoose.model('Payment')
          .findOne({ invoiceNumber: new RegExp(`^${prefix}`) })
          .sort({ invoiceNumber: -1 })
          .select('invoiceNumber');
        
        let nextNumber = 1;
        if (lastInvoice && lastInvoice.invoiceNumber) {
          const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
          nextNumber = lastNumber + 1;
        }
        
        this.invoiceNumber = `${prefix}${String(nextNumber).padStart(5, '0')}`;
        this.invoiceDate = new Date();
        break;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          return next(new Error('Failed to generate unique invoice number after multiple attempts'));
        }
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
      }
    }
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
