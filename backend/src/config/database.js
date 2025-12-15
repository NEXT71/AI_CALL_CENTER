const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info('MongoDB connected successfully', { host: conn.connection.host });
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    logger.error('MongoDB connection failed - exiting', { error: error.message });
    process.exit(1);
  }
};

module.exports = connectDB;
