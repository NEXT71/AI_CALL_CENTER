// Test script to identify subscription controller loading issue
console.log('Testing subscriptionController import...');

try {
  console.log('1. Checking if multer is available...');
  const multer = require('multer');
  console.log('✅ multer loaded');

  console.log('2. Checking if fs is available...');
  const fs = require('fs');
  console.log('✅ fs loaded');

  console.log('3. Checking if path is available...');
  const path = require('path');
  console.log('✅ path loaded');

  console.log('4. Attempting to load subscriptionController...');
  const subscriptionController = require('./src/controllers/subscriptionController');
  console.log('✅ subscriptionController loaded successfully!');
  
  console.log('5. Checking exported functions...');
  console.log('   - getPlans:', typeof subscriptionController.getPlans);
  console.log('   - adminActivateSubscription:', typeof subscriptionController.adminActivateSubscription);
  console.log('   - getPendingPayments:', typeof subscriptionController.getPendingPayments);
  
  console.log('\n✅ ALL TESTS PASSED!');
} catch (error) {
  console.error('\n❌ ERROR LOADING MODULE:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
