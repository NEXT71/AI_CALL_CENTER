const logger = require('./logger');

/**
 * Validate required environment variables on startup
 */
const validateEnv = () => {
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT secrets are strong enough (64+ chars recommended)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
    warnings.push(`JWT_SECRET is ${process.env.JWT_SECRET.length} characters (recommended: 64+)`);
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 64) {
    warnings.push(`JWT_REFRESH_SECRET is ${process.env.JWT_REFRESH_SECRET.length} characters (recommended: 64+)`);
  }

  // Validate critical services (warn if missing)
  if (!process.env.AI_SERVICE_URL) {
    warnings.push('AI_SERVICE_URL not set - AI processing will fail');
  }

  // Validate Stripe configuration (warn if missing in production)
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.STRIPE_SECRET_KEY) {
      warnings.push('STRIPE_SECRET_KEY not set - payments will fail');
    }
    if (!process.env.STRIPE_PUBLISHABLE_KEY) {
      warnings.push('STRIPE_PUBLISHABLE_KEY not set - frontend payments will fail');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      warnings.push('STRIPE_WEBHOOK_SECRET not set - webhook verification will be skipped');
    }
  }

  // Validate SMTP configuration (info only)
  if (!process.env.SMTP_USER) {
    logger.info('SMTP not configured - emails will be logged to console only');
  }

  // Log warnings
  if (warnings.length > 0) {
    warnings.forEach(warning => logger.warn(warning));
  }

  logger.info('Environment validation passed', { 
    warnings: warnings.length,
    mode: process.env.NODE_ENV || 'development'
  });
};

module.exports = validateEnv;
