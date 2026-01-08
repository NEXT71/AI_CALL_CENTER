// Load environment variables - handle missing .env file gracefully
try {
  require('dotenv').config();
  console.log('ðŸ” DEBUG: server.js loaded, dotenv configured');
} catch (error) {
  console.log('âš ï¸ DEBUG: dotenv failed to load:', error.message);
  console.log('ðŸ” DEBUG: server.js loaded without dotenv');
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/database');
console.log('âœ… DEBUG: connectDB imported');
const errorHandler = require('./middleware/errorHandler');
console.log('âœ… DEBUG: errorHandler imported');
const config = require('./config/config');
console.log('âœ… DEBUG: config imported');
const { apiLimiter } = require('./middleware/rateLimiter');
console.log('âœ… DEBUG: rateLimiter imported');
const logger = require('./config/logger');
console.log('âœ… DEBUG: Logger imported and initialized');
const validateEnv = require('./config/validateEnv');
console.log('âœ… DEBUG: validateEnv imported successfully');

// Import routes
console.log('ðŸ” DEBUG: Importing routes...');
const authRoutes = require('./routes/authRoutes');
console.log('âœ… DEBUG: authRoutes imported');
const callRoutes = require('./routes/callRoutes');
console.log('âœ… DEBUG: callRoutes imported');
const ruleRoutes = require('./routes/ruleRoutes');
console.log('âœ… DEBUG: ruleRoutes imported');
const reportRoutes = require('./routes/reportRoutes');
console.log('âœ… DEBUG: reportRoutes imported');
const salesRoutes = require('./routes/salesRoutes');
console.log('âœ… DEBUG: salesRoutes imported');
// const queueRoutes = require('./routes/queueRoutes'); // Temporarily disabled - Redis not running
const auditLogRoutes = require('./routes/auditLogRoutes');
console.log('âœ… DEBUG: auditLogRoutes imported');
console.log('ðŸ” DEBUG: About to import subscriptionRoutes...');
// const subscriptionRoutes = require('./routes/subscriptionRoutes');
// console.log('âœ… DEBUG: subscriptionRoutes imported');
const webhookRoutes = require('./routes/webhookRoutes');
console.log('âœ… DEBUG: webhookRoutes imported');

// Import jobs
// const fileCleanupJob = require('./jobs/fileCleanup'); // Temporarily disabled

console.log('ðŸ” DEBUG: Starting environment validation...');

// Validate environment variables before starting
try {
  console.log('ðŸ” DEBUG: About to validate environment variables...');
  validateEnv();
  console.log('âœ… DEBUG: Environment validation passed');
  logger.info('Environment validation passed');
} catch (error) {
  console.log('âŒ DEBUG: Environment validation failed:', error.message);
  logger.error('Environment validation failed', { error: error.message });
  console.error('ENV VALIDATION ERROR:', error.message);
  process.exit(1);
}

// Initialize express app
console.log('ðŸ” DEBUG: Initializing Express app...');
const app = express();

// Trust proxy - required for Render and other reverse proxy deployments
// This allows express-rate-limit to correctly identify client IPs
app.set('trust proxy', 1);

// Connect to MongoDB
console.log('ðŸ” DEBUG: About to connect to MongoDB...');
connectDB();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
})); // Secure HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(compression()); // Compress responses
app.use(cookieParser()); // Parse cookies

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : config.nodeEnv === 'production'
    ? [] // Reject all origins in production if ALLOWED_ORIGINS not set (security)
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Warn if CORS not configured in production
if (config.nodeEnv === 'production' && !process.env.ALLOWED_ORIGINS) {
  logger.warn('ALLOWED_ORIGINS not set in production - CORS will reject all requests');
}

app.use(cors(corsOptions));

// Stripe webhook endpoint - MUST be before body parser
// Stripe needs raw body for signature verification
app.use('/api/webhooks', webhookRoutes);

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

// Root route - API information
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Call Center QA Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      docs: 'https://github.com/your-repo/docs'
    },
    timestamp: new Date().toISOString()
  });
});

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

// API Routes - Version 1
const API_VERSION = '/api/v1';

app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/calls`, callRoutes);
app.use(`${API_VERSION}/rules`, ruleRoutes);
app.use(`${API_VERSION}/reports`, reportRoutes);
app.use(`${API_VERSION}/sales`, salesRoutes);
// app.use(`${API_VERSION}/queue`, queueRoutes); // Temporarily disabled - Redis not running
app.use(`${API_VERSION}/audit-logs`, auditLogRoutes);
// app.use(`${API_VERSION}/subscriptions`, subscriptionRoutes); // Temporarily disabled - import failing

// Legacy routes (deprecated - redirect to v1)
app.use('/api/auth', (req, res) => res.redirect(308, `${API_VERSION}/auth${req.url}`));
app.use('/api/calls', (req, res) => res.redirect(308, `${API_VERSION}/calls${req.url}`));
app.use('/api/rules', (req, res) => res.redirect(308, `${API_VERSION}/rules${req.url}`));
app.use('/api/reports', (req, res) => res.redirect(308, `${API_VERSION}/reports${req.url}`));
app.use('/api/sales', (req, res) => res.redirect(308, `${API_VERSION}/sales${req.url}`));
app.use('/api/audit-logs', (req, res) => res.redirect(308, `${API_VERSION}/audit-logs${req.url}`));
// app.use('/api/subscriptions', (req, res) => res.redirect(308, `${API_VERSION}/subscriptions${req.url}`)); // Temporarily disabled

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
console.log('ðŸ” DEBUG: About to start server on port:', PORT);

const server = app.listen(PORT, () => {
  console.log('âœ… DEBUG: Server started successfully on port:', PORT);
  logger.info('Server started successfully', { 
    environment: config.nodeEnv,
    port: PORT,
    apiVersion: '/api/v1'
  });
  
  // Start scheduled jobs
  // fileCleanupJob.start(); // Temporarily disabled
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
  logger.error('Unhandled Rejection - shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception - shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = app;
