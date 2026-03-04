require('dotenv').config();

// 2026 BPO Pricing Model - Updated March 2026
// Internal cost: $0.01-$0.02/min (RunPod GPU + telephony)
// Target margin: 70-80%
const PLAN_CONFIG = {
  free: {
    name: 'Free',
    amount: 0,
    interval: 'month',
    includedMinutes: 500,
    includedCalls: -1,
    overageRate: 0,
    effectiveRate: 0,
    concurrencyLimit: 1,
    features: [
      '500 minutes/month (~25-35 calls)',
      'Standard AI transcription & scoring',
      '1 QA Rubric (pre-built templates)',
      'Community support (forum/docs)',
      '1 team member',
      '14-day data retention',
      '1 concurrent processing stream',
      'Export to CSV only',
    ],
    limits: {
      callsPerMonth: -1,
      minutesPerMonth: 500,
      storageGB: 2,
      dataRetentionDays: 14,
      teamMembers: 1,
      concurrentCalls: 1,
      apiAccess: false,
      customRubrics: 1,
      additionalUserCost: 0,
    }
  },
  starter: {
    name: 'Starter',
    amount: 12900, // $129/month
    interval: 'month',
    includedMinutes: 1500,
    includedCalls: -1,
    overageRate: 0.14, // $0.14/min
    effectiveRate: 0.086,
    concurrencyLimit: 3,
    features: [
      '1,500 minutes/month (~100 calls)',
      '$0.14/min overage rate',
      'Standard AI transcription & quality scoring',
      '3 custom QA Rubrics',
      'Email support (48hr response)',
      '3 team members ($25/additional)',
      '30-day data retention',
      '3 parallel processing streams',
      'Export to CSV & PDF',
      'Basic analytics dashboard',
    ],
    limits: {
      callsPerMonth: -1,
      minutesPerMonth: 1500,
      storageGB: 15,
      dataRetentionDays: 30,
      teamMembers: 3,
      concurrentCalls: 3,
      apiAccess: false,
      customRubrics: 3,
      additionalUserCost: 25,
    }
  },
  growth: {
    name: 'Growth',
    amount: 19900, // $199/month
    interval: 'month',
    includedMinutes: 2500,
    includedCalls: -1,
    overageRate: 0.11, // $0.11/min
    effectiveRate: 0.079,
    concurrencyLimit: 5,
    features: [
      '2,500 minutes/month (~150-175 calls)',
      '$0.11/min overage rate',
      'Enhanced AI analysis (sentiment, talk-time)',
      '5 custom QA Scorecards & Rubrics',
      'Priority email support (24hr response)',
      '5 team members ($30/additional)',
      '60-day data retention',
      '5 parallel processing streams',
      'API access (rate-limited: 100 req/hour)',
      'Advanced analytics & reporting',
      'Bulk export options',
      'Basic coaching insights',
    ],
    limits: {
      callsPerMonth: -1,
      minutesPerMonth: 2500,
      storageGB: 30,
      dataRetentionDays: 60,
      teamMembers: 5,
      concurrentCalls: 5,
      apiAccess: true,
      apiRateLimit: 100,
      customRubrics: 5,
      additionalUserCost: 30,
    }
  },
  professional: {
    name: 'Professional',
    amount: 29900, // $299/month
    interval: 'month',
    includedMinutes: 4000,
    includedCalls: -1,
    overageRate: 0.09, // $0.09/min
    effectiveRate: 0.074,
    concurrencyLimit: 10,
    features: [
      '4,000 minutes/month (~250-300 calls)',
      '$0.09/min overage rate',
      'Advanced AI (objection handling, script adherence)',
      'Unlimited custom QA Scorecards & Rubrics',
      'Priority support (12hr response) + live chat',
      '10 team members ($35/additional)',
      '90-day data retention',
      '10 parallel processing streams',
      'API access (5,000 req/hour)',
      'Advanced coaching insights',
      'Custom reports & scheduled exports',
      'Webhook integrations',
      'Single Sign-On (SSO)',
    ],
    limits: {
      callsPerMonth: -1,
      minutesPerMonth: 4000,
      storageGB: 50,
      dataRetentionDays: 90,
      teamMembers: 10,
      concurrentCalls: 10,
      apiAccess: true,
      apiRateLimit: 5000,
      customRubrics: -1,
      additionalUserCost: 35,
    }
  },
  enterprise: {
    name: 'Enterprise',
    amount: 89900, // $899/month
    interval: 'month',
    includedMinutes: 15000,
    includedCalls: -1,
    overageRate: 0.06, // $0.06/min
    effectiveRate: 0.059,
    concurrencyLimit: -1,
    features: [
      '15,000 minutes/month (~1,000 calls)',
      '$0.06/min overage rate',
      'Full AI suite (diarization, coaching, semantic search)',
      'Unlimited custom QA models & scorecards',
      '24/7 priority support + dedicated account manager',
      'Unlimited team members',
      '1-year data retention (archive available)',
      'Unlimited parallel processing streams',
      'Unlimited API access',
      'Custom AI model training',
      'Advanced security (SSO, SAML, audit logs)',
      'SLA guarantees (99.9% uptime)',
      'White-labeling options',
      'Custom integrations',
      'Quarterly business reviews',
    ],
    limits: {
      callsPerMonth: -1,
      minutesPerMonth: 15000,
      storageGB: -1,
      dataRetentionDays: 365,
      teamMembers: -1,
      concurrentCalls: -1,
      apiAccess: true,
      apiRateLimit: -1,
      customRubrics: -1,
      additionalUserCost: 0,
    }
  }
};

const USAGE_ALERT_THRESHOLDS = [0.8, 0.9, 1.0, 1.2];

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expire: process.env.JWT_EXPIRE || '7d',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
  },
  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads/calls',
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB
  },
  subscription: {
    plans: PLAN_CONFIG,
    usageAlertThresholds: USAGE_ALERT_THRESHOLDS,
  },
};
