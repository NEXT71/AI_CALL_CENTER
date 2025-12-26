const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    console.log('🔍 DEBUG: Starting MongoDB connection...');
    console.log('🔍 DEBUG: MONGO_URI exists:', !!process.env.MONGO_URI);
    console.log('🔍 DEBUG: MONGO_URI starts with:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'undefined');

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000,
    });

    console.log('✅ DEBUG: MongoDB connected successfully');
    logger.info('MongoDB connected successfully', { host: conn.connection.host });
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    console.log('❌ DEBUG: MongoDB connection failed');
    console.log('❌ DEBUG: Error message:', error.message);
    console.log('❌ DEBUG: Error code:', error.code);
    console.log('❌ DEBUG: Error codeName:', error.codeName);
    logger.error('MongoDB connection failed - exiting', { error: error.message });
    process.exit(1);
  }
};

module.exports = connectDB;
