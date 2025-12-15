#!/usr/bin/env node
/**
 * Production Readiness Checker
 * Validates environment configuration before deployment
 * Run: npm run check-production
 */

require('dotenv').config();
const logger = require('../config/logger');
const crypto = require('crypto');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

const issues = {
  critical: [],
  warnings: [],
  passed: [],
};

console.log('\n' + '='.repeat(80));
console.log(`${colors.blue}🔍 PRODUCTION READINESS CHECK${colors.reset}`);
console.log('='.repeat(80) + '\n');

/**
 * Check MongoDB configuration
 */
function checkMongoDB() {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    issues.critical.push('MONGO_URI is not set');
    return;
  }
  
  // Check for default/weak passwords
  const weakPasswords = ['password', 'admin', '12345', 'Nextel123', 'test'];
  const hasWeakPassword = weakPasswords.some(pwd => mongoUri.includes(pwd));
  
  if (hasWeakPassword) {
    issues.critical.push('MongoDB URI contains a weak/default password');
  } else {
    issues.passed.push('MongoDB URI configured');
  }
  
  // Check if password is visible in URI (should use secrets manager in production)
  if (process.env.NODE_ENV === 'production' && mongoUri.includes('://')) {
    issues.warnings.push('Consider using MongoDB connection with secrets manager in production');
  }
}

/**
 * Check JWT secrets strength
 */
function checkJWTSecrets() {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtSecret || !jwtRefreshSecret) {
    issues.critical.push('JWT secrets are not configured');
    return;
  }
  
  // Check length
  if (jwtSecret.length < 64) {
    issues.critical.push(`JWT_SECRET is only ${jwtSecret.length} characters (minimum: 64)`);
  } else {
    issues.passed.push('JWT_SECRET has sufficient length');
  }
  
  if (jwtRefreshSecret.length < 64) {
    issues.critical.push(`JWT_REFRESH_SECRET is only ${jwtRefreshSecret.length} characters (minimum: 64)`);
  } else {
    issues.passed.push('JWT_REFRESH_SECRET has sufficient length');
  }
  
  // Check for default values
  const defaultSecrets = ['dev-jwt-secret-key', 'your-secret-key', 'secret', 'changeme'];
  const isDefaultSecret = defaultSecrets.some(s => 
    jwtSecret.toLowerCase().includes(s) || jwtRefreshSecret.toLowerCase().includes(s)
  );
  
  if (isDefaultSecret) {
    issues.critical.push('JWT secrets appear to be default values - generate new secrets');
  }
}

/**
 * Check CORS configuration
 */
function checkCORS() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  
  if (process.env.NODE_ENV === 'production') {
    if (!allowedOrigins) {
      issues.critical.push('ALLOWED_ORIGINS not set in production - CORS will block all requests');
    } else if (allowedOrigins.includes('localhost')) {
      issues.warnings.push('ALLOWED_ORIGINS includes localhost in production');
    } else {
      issues.passed.push('CORS configured for production');
    }
  } else {
    issues.passed.push('CORS configured for development');
  }
}

/**
 * Check Stripe configuration
 */
function checkStripe() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripePublic = process.env.STRIPE_PUBLISHABLE_KEY;
  const stripePrices = [
    process.env.STRIPE_STARTER_PRICE_ID,
    process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    process.env.STRIPE_ENTERPRISE_PRICE_ID,
  ];
  
  if (!stripeSecret || !stripePublic) {
    issues.warnings.push('Stripe keys not configured - payments will not work');
  } else {
    // Check if using test keys in production
    if (process.env.NODE_ENV === 'production') {
      if (stripeSecret.startsWith('sk_test_')) {
        issues.critical.push('Using Stripe TEST keys in production! Switch to live keys.');
      } else if (stripeSecret.startsWith('sk_live_')) {
        issues.passed.push('Stripe configured with LIVE keys');
      }
    } else {
      if (stripeSecret.startsWith('sk_test_')) {
        issues.passed.push('Stripe configured with test keys');
      }
    }
    
    // Check price IDs
    const missingPrices = stripePrices.filter(id => !id);
    if (missingPrices.length > 0) {
      issues.warnings.push(`${missingPrices.length} Stripe Price IDs not configured`);
    } else {
      issues.passed.push('All Stripe Price IDs configured');
    }
  }
}

/**
 * Check AI Service
 */
function checkAIService() {
  const aiServiceUrl = process.env.AI_SERVICE_URL;
  
  if (!aiServiceUrl) {
    issues.critical.push('AI_SERVICE_URL not configured - AI processing will fail');
  } else if (aiServiceUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    issues.critical.push('AI_SERVICE_URL points to localhost in production');
  } else {
    issues.passed.push('AI Service URL configured');
  }
}

/**
 * Check Email configuration
 */
function checkEmail() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpUser || !smtpPass) {
    issues.warnings.push('SMTP not configured - emails will be logged to console only');
  } else {
    issues.passed.push('SMTP configured for email delivery');
  }
}

/**
 * Check environment mode
 */
function checkEnvironment() {
  const nodeEnv = process.env.NODE_ENV;
  
  if (!nodeEnv) {
    issues.warnings.push('NODE_ENV not set (defaulting to development)');
  } else if (nodeEnv === 'production') {
    console.log(`${colors.yellow}⚠️  Running in PRODUCTION mode${colors.reset}\n`);
  } else {
    console.log(`${colors.green}ℹ️  Running in ${nodeEnv.toUpperCase()} mode${colors.reset}\n`);
  }
}

/**
 * Print results
 */
function printResults() {
  console.log(`${colors.green}✅ PASSED (${issues.passed.length})${colors.reset}`);
  issues.passed.forEach(item => console.log(`   ✓ ${item}`));
  console.log('');
  
  if (issues.warnings.length > 0) {
    console.log(`${colors.yellow}⚠️  WARNINGS (${issues.warnings.length})${colors.reset}`);
    issues.warnings.forEach(item => console.log(`   ⚠ ${item}`));
    console.log('');
  }
  
  if (issues.critical.length > 0) {
    console.log(`${colors.red}❌ CRITICAL ISSUES (${issues.critical.length})${colors.reset}`);
    issues.critical.forEach(item => console.log(`   ✗ ${item}`));
    console.log('');
  }
  
  console.log('='.repeat(80));
  
  if (issues.critical.length === 0) {
    console.log(`${colors.green}✅ Production readiness: PASSED${colors.reset}`);
    console.log(`   Warnings: ${issues.warnings.length}`);
    console.log('='.repeat(80) + '\n');
    
    if (issues.warnings.length > 0) {
      console.log(`${colors.yellow}ℹ️  Review warnings before deploying to production${colors.reset}\n`);
    }
    
    return 0;
  } else {
    console.log(`${colors.red}❌ Production readiness: FAILED${colors.reset}`);
    console.log(`   Critical issues: ${issues.critical.length}`);
    console.log(`   Warnings: ${issues.warnings.length}`);
    console.log('='.repeat(80));
    console.log(`\n${colors.red}🚫 FIX CRITICAL ISSUES BEFORE DEPLOYING!${colors.reset}\n`);
    
    console.log('Quick fixes:');
    console.log('  1. Generate secrets:  npm run generate-secrets');
    console.log('  2. Update .env with new secrets');
    console.log('  3. Rotate MongoDB password in Atlas');
    console.log('  4. Set ALLOWED_ORIGINS for production');
    console.log('  5. Switch to Stripe live keys (if deploying to production)\n');
    
    return 1;
  }
}

// Run all checks
checkEnvironment();
checkMongoDB();
checkJWTSecrets();
checkCORS();
checkStripe();
checkAIService();
checkEmail();

// Print results and exit
const exitCode = printResults();
process.exit(exitCode);
