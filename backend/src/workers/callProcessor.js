require('dotenv').config();
const connectDB = require('../config/database');
const logger = require('../config/logger');
const callQueue = require('../queues/callProcessingQueue');

// Connect to database
connectDB();

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY) || 2;
const WORKER_ID = process.env.WORKER_ID || `worker-${process.pid}`;

logger.info('Call processing worker started', {
  workerId: WORKER_ID,
  concurrency: CONCURRENCY,
  device: process.env.DEVICE || 'cpu',
  redis: `${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
});

// Health check interval
setInterval(async () => {
  const stats = await require('../queues/callProcessingQueue').getQueueStats();
  
  logger.info('Worker health check', {
    workerId: WORKER_ID,
    queueStats: stats,
    memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
    uptime: `${(process.uptime() / 60).toFixed(2)}min`,
  });
}, 60000); // Every minute

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down worker gracefully...`, {
    workerId: WORKER_ID,
  });

  try {
    // Stop accepting new jobs
    await callQueue.pause(true, true);
    logger.info('Queue paused, waiting for active jobs to complete...');

    // Wait for active jobs (max 5 minutes)
    const timeout = setTimeout(() => {
      logger.warn('Force closing after timeout');
      process.exit(1);
    }, 300000);

    // Close queue
    await callQueue.close();
    clearTimeout(timeout);

    // Close database
    const mongoose = require('mongoose');
    await mongoose.connection.close();

    logger.info('Worker shut down successfully', { workerId: WORKER_ID });
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception in worker', {
    workerId: WORKER_ID,
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection in worker', {
    workerId: WORKER_ID,
    reason,
  });
  process.exit(1);
});

logger.info('Worker ready to process calls', { workerId: WORKER_ID });
