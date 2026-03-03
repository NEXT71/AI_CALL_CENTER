require('dotenv').config();

// 2026 BPO Pricing Model
// Internal cost: $0.01-$0.02/min (RunPod GPU + telephony)
// Target margin: 70-80%
const PLAN_CONFIG = {
  free: {
    name: 'Free',
    amount: 0,
    interval: 'month',
    includedMinutes: 0,
    includedCalls: 10,
    overageRate: 0,
    effectiveRate: 0,
    concurrencyLimit: 1,
    features: [
      '10 calls/month',
      'Basic transcription',
      'Community support',
      '1 team member',
      '7-day data retention',
      '1 concurrent call',
    ],
    limits: {
      callsPerMonth: 10,
      minutesPerMonth: 0,
      storageGB: 1,
      dataRetentionDays: 7,
      teamMembers: 1,
      concurrentCalls: 1,
      apiAccess: false,
    }
  },
  starter: {
    name: 'Starter (Team)',
    amount: 12900, // $129/month
    interval: 'month',
    includedMinutes: 1000,
    includedCalls: -1,
    overageRate: 0.14, // $0.14/min
    effectiveRate: 0.129,
    concurrencyLimit: 5,
    features: [
      '1,000 minutes/month',
      'Unlimited calls within minutes',
      'Basic AI transcription & quality scoring',
      'Email support (48hr response)',
      '3 team members',
      '30-day data retention',
      '5 simultaneous calls',
      '$0.14/min overage rate',
    ],
    limits: {
      callsPerMonth: -1,
      minutesPerMonth: 1000,
      storageGB: 10,
      dataRetentionDays: 30,
      teamMembers: 3,
      concurrentCalls: 5,
      apiAccess: false,
    }
  },
  professional: {
    name: 'Professional (BPO)',
    amount: 29900, // $299/month
    interval: 'month',
    includedMinutes: 3000,
    includedCalls: -1,
    overageRate: 0.09, // $0.09/min
    effectiveRate: 0.099,
    concurrencyLimit: 25,
    features: [
      '3,000 minutes/month',
      'Unlimited calls within minutes',
      'Advanced AI analysis (sentiment, compliance)',
      'Priority support (24hr response)',
      '10 team members',
      '90-day data retention',
      '25 simultaneous calls',
      'API access',
      'Custom compliance rules',
      '$0.09/min overage rate',
    ],
    limits: {
      callsPerMonth: -1,
      minutesPerMonth: 3000,
      storageGB: 50,
      dataRetentionDays: 90,
      teamMembers: 10,
      concurrentCalls: 25,
      apiAccess: true,
    }
  },
  enterprise: {
    name: 'Enterprise (Scale)',
    amount: 89900, // $899/month
    interval: 'month',
    includedMinutes: 12000,
    includedCalls: -1,
    overageRate: 0.06, // $0.06/min
    effectiveRate: 0.074,
    concurrencyLimit: -1,
    features: [
      '12,000 minutes/month',
      'Unlimited calls',
      'Full AI suite (diarization, coaching, search)',
      '24/7 priority support + dedicated account manager',
      'Unlimited team members',
      '1-year data retention',
      'Unlimited concurrent calls',
      'Custom AI models & white-labeling',
      'SLA guarantees (99.9% uptime)',
      'On-premise deployment option',
      '$0.06/min overage rate',
    ],
    limits: {
      callsPerMonth: -1,
      minutesPerMonth: 12000,
      storageGB: -1,
      dataRetentionDays: 365,
      teamMembers: -1,
      concurrentCalls: -1,
      apiAccess: true,
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
