/**
 * Generate secure environment secrets
 * Run: node generateSecrets.js
 */

const crypto = require('crypto');

console.log('\n' + '='.repeat(80));
console.log('🔐 SECURE ENVIRONMENT SECRETS GENERATOR');
console.log('='.repeat(80) + '\n');

console.log('Copy these values to your .env file:\n');

console.log('# JWT Secrets (64 characters each)');
console.log(`JWT_SECRET=${crypto.randomBytes(64).toString('hex')}`);
console.log(`JWT_REFRESH_SECRET=${crypto.randomBytes(64).toString('hex')}`);

console.log('\n# Session Secret (64 characters)');
console.log(`SESSION_SECRET=${crypto.randomBytes(64).toString('hex')}`);

console.log('\n# Encryption Key (32 bytes = 64 hex chars)');
console.log(`ENCRYPTION_KEY=${crypto.randomBytes(32).toString('hex')}`);

console.log('\n' + '='.repeat(80));
console.log('⚠️  IMPORTANT: Keep these secrets secure!');
console.log('   - Never commit to Git');
console.log('   - Rotate in production every 90 days');
console.log('   - Use different secrets for dev/staging/prod');
console.log('='.repeat(80) + '\n');
