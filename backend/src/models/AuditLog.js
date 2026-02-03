const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for failed login attempts
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'REGISTER',
        'UPDATE_USER',
        'DELETE_USER',
        'UPLOAD_CALL',
        'DELETE_CALL',
        'CREATE_RULE',
        'UPDATE_RULE',
        'DELETE_RULE',
        'VIEW_REPORT',
        'FAILED_LOGIN',
        'SUBSCRIPTION_MANUAL_PAYMENT_REQUEST',
        'SUBSCRIPTION_REQUEST_CREATED',
        'SUBSCRIPTION_ADMIN_ACTIVATED',
        'SUBSCRIPTION_CANCEL_REQUEST',
        'SUBSCRIPTION_REACTIVATE_REQUEST',
        'SUBSCRIPTION_DOWNGRADE',
      ],
    },
    resourceType: {
      type: String,
      enum: ['User', 'Call', 'ComplianceRule', 'Report', 'Auth', 'Subscription'],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ status: 1 });
// Compound indexes for audit queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, status: 1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
