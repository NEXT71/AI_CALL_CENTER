const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/config');
const { apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./config/logger');
const validateEnv = require('./config/validateEnv');

// Import routes
const authRoutes = require('./routes/authRoutes');
const callRoutes = require('./routes/callRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const reportRoutes = require('./routes/reportRoutes');
const queueRoutes = require('./routes/queueRoutes');

// Import jobs
const fileCleanupJob = require('./jobs/fileCleanup');

// Validate environment variables before starting
validateEnv();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet()); // Secure HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(compression()); // Compress responses

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : config.nodeEnv === 'production'
    ? ['https://your-app.vercel.app'] // Update with your actual Vercel URL
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout (30 seconds)
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    logger.warn('Request timeout', { url: req.url, method: req.method });
    res.status(408).json({ success: false, message: 'Request timeout' });
  });
  next();
});

// HTTP request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Apply rate limiter to all API routes
app.use('/api/', apiLimiter);

// Health check
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const aiService = require('./services/aiService');
  const os = require('os');
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    checks: {
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        state: mongoose.connection.readyState,
      },
      aiService: {
        status: 'checking',
      },
      memory: {
        total: Math.round(os.totalmem() / 1024 / 1024),
        free: Math.round(os.freemem() / 1024 / 1024),
        usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      disk: {
        uploadsDir: config.upload.dir,
      },
    },
  };

  // Check AI Service health
  try {
    const aiHealthy = await aiService.healthCheck();
    health.checks.aiService.status = aiHealthy ? 'healthy' : 'unhealthy';
  } catch (error) {
    health.checks.aiService.status = 'error';
    health.checks.aiService.error = error.message;
  }

  // Determine overall health status
  if (health.checks.database.status !== 'connected' || 
      health.checks.aiService.status !== 'healthy') {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/queue', queueRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, { 
    environment: config.nodeEnv,
    port: PORT 
  });
  
  // Start scheduled jobs
  fileCleanupJob.start();
  
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🎯 AI Call Center API Server                       ║
  ║                                                       ║
  ║   Environment: ${config.nodeEnv.toUpperCase().padEnd(38)} ║
  ║   Port: ${PORT.toString().padEnd(44)} ║
  ║   Database: Connected                                 ║
  ║                                                       ║
  ║   📝 API Docs: http://localhost:${PORT}                  ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, starting graceful shutdown`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connection
    const mongoose = require('mongoose');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forceful shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = app;
