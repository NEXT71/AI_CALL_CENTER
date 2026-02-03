const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      validate: {
        validator: function(password) {
          // Check for at least one uppercase, lowercase, number, and special character
          const hasUpperCase = /[A-Z]/.test(password);
          const hasLowerCase = /[a-z]/.test(password);
          const hasNumber = /\d/.test(password);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
          return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
        },
        message: 'Password must include uppercase, lowercase, numbers, and special characters'
      },
      select: false,
    },
    role: {
      type: String,
      enum: ['Admin', 'User'],
      default: 'User',
      required: true,
    },
    department: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    company: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'starter', 'professional', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['free', 'trial', 'active', 'expired', 'cancelled'],
        default: 'free',
      },
      billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
      },
      trialEndsAt: {
        type: Date,
        default: function() {
          // Default 14-day trial
          return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        },
      },
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      autoRenew: {
        type: Boolean,
        default: false,
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return token; // Return unhashed token to send via email
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return token; // Return unhashed token to send via email
};

// Remove password from JSON response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Indexes for efficient querying
// Note: email already has unique index from schema definition above
userSchema.index({ role: 1 });
userSchema.index({ 'subscription.status': 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ emailVerified: 1 });
userSchema.index({ createdAt: -1 });
// Compound indexes for common queries
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'subscription.status': 1, 'subscription.currentPeriodEnd': 1 });

module.exports = mongoose.model('User', userSchema);
