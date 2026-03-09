// Load environment variables - handle missing .env file gracefully
try {
  require('dotenv').config();
  console.log('🔍 DEBUG: server.js loaded, dotenv configured - v1.0.2');
} catch (error) {
  console.log('⚠️ DEBUG: dotenv failed to load:', error.message);
  console.log('🔍 DEBUG: server.js loaded without dotenv');
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/database');
console.log('✅ DEBUG: connectDB imported');
const errorHandler = require('./middleware/errorHandler');
console.log('✅ DEBUG: errorHandler imported');
const config = require('./config/config');
console.log('✅ DEBUG: config imported');
const { apiLimiter } = require('./middleware/rateLimiter');
console.log('✅ DEBUG: rateLimiter imported');
const logger = require('./config/logger');
console.log('✅ DEBUG: Logger imported and initialized');
const validateEnv = require('./config/validateEnv');
console.log('✅ DEBUG: validateEnv imported successfully');

// Import routes
console.log('🔍 DEBUG: Importing routes...');
const authRoutes = require('./routes/authRoutes');
console.log('✅ DEBUG: authRoutes imported');
const callRoutes = require('./routes/callRoutes');
console.log('✅ DEBUG: callRoutes imported');
const ruleRoutes = require('./routes/ruleRoutes');
console.log('✅ DEBUG: ruleRoutes imported');
const reportRoutes = require('./routes/reportRoutes');
console.log('✅ DEBUG: reportRoutes imported');
const salesRoutes = require('./routes/salesRoutes');
console.log('✅ DEBUG: salesRoutes imported');
const coachingRoutes = require('./routes/coachingRoutes');
console.log('✅ DEBUG: coachingRoutes imported');
// const queueRoutes = require('./routes/queueRoutes'); // Temporarily disabled - Redis not running
const auditLogRoutes = require('./routes/auditLogRoutes');
console.log('✅ DEBUG: auditLogRoutes imported');
console.log('🔍 DEBUG: About to import subscriptionRoutes...');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
console.log('✅ DEBUG: subscriptionRoutes imported');
const webhookRoutes = require('./routes/webhookRoutes');
console.log('✅ DEBUG: webhookRoutes imported');
// RunPod GPU Control Routes
console.log('🚀 DEBUG: Attempting to import runpodRoutes...');
const runpodRoutes = require('./routes/runpodRoutes');
console.log('✅ DEBUG: runpodRoutes imported successfully');
console.log('🔍 DEBUG: runpodRoutes type:', typeof runpodRoutes);
console.log('🔍 DEBUG: runpodRoutes.stack:', runpodRoutes.stack ? 'has routes' : 'NO ROUTES');

// Import jobs
const fileCleanupJob = require('./jobs/fileCleanup');
const subscriptionExpiration = require('./jobs/subscriptionExpiration');

console.log('🔍 DEBUG: Starting environment validation...');

// Validate environment variables before starting
try {
  console.log('🔍 DEBUG: About to validate environment variables...');
  validateEnv();
  console.log('✅ DEBUG: Environment validation passed');
  logger.info('Environment validation passed');
} catch (error) {
  console.log('❌ DEBUG: Environment validation failed:', error.message);
  logger.error('Environment validation failed', { error: error.message });
  console.error('ENV VALIDATION ERROR:', error.message);
  process.exit(1);
}

// Initialize express app
console.log('🔍 DEBUG: Initializing Express app...');
const app = express();

// Ensure upload directories exist
const fs = require('fs');
const path = require('path');
const ensureUploadDirectories = () => {
  const directories = [
    config.upload.dir,
    path.join(__dirname, '../temp')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
      console.log(`✅ DEBUG: Created directory: ${dir}`);
    } else {
      console.log(`✅ DEBUG: Directory already exists: ${dir}`);
    }
  });
};

console.log('🔍 DEBUG: Ensuring upload directories exist...');
ensureUploadDirectories();

// Trust proxy - required for Render and other reverse proxy deployments
// This allows express-rate-limit to correctly identify client IPs
app.set('trust proxy', 1);

// Connect to MongoDB
console.log('🔍 DEBUG: About to connect to MongoDB...');
connectDB().catch((error) => {
  console.error('❌ DEBUG: MongoDB connection failed:', error);
  logger.error('MongoDB connection failed', { error: error.message });
  process.exit(1);
});

// Security Middleware
console.log('🔍 DEBUG: Setting up security middleware...');
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid issues
  crossOriginEmbedderPolicy: false,
})); // Secure HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(compression()); // Compress responses
app.use(cookieParser()); // Parse cookies
console.log('✅ DEBUG: Security middleware set up');

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : config.nodeEnv === 'production'
    ? false // Allow all origins in production if not specified (less secure but functional)
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Warn if CORS not configured in production
if (config.nodeEnv === 'production' && !process.env.ALLOWED_ORIGINS) {
  logger.warn('ALLOWED_ORIGINS not set in production - CORS will allow all origins');
}

app.use(cors(corsOptions));

// Serve temporary audio files publicly for RunPod serverless access
// RunPod will download audio from this endpoint
app.use('/temp-audio', express.static(path.join(__dirname, '../uploads/calls'), {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac'
    };
    if (contentTypes[ext]) {
      res.setHeader('Content-Type', contentTypes[ext]);
    }
  }
}));
console.log('✅ DEBUG: Public audio endpoint mounted at /temp-audio');

// Stripe webhook endpoint - MUST be before body parser
// Stripe needs raw body for signature verification
console.log('🔍 DEBUG: Mounting webhook routes...');
app.use('/api/v1/webhooks', webhookRoutes);
console.log('✅ DEBUG: Webhook routes mounted at /api/v1/webhooks');

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
    version: '1.0.1',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      runpod: '/api/v1/runpod',
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
console.log('🔍 DEBUG: Mounting API routes...');

console.log('🔍 DEBUG: Mounting auth routes...');
app.use(`${API_VERSION}/auth`, authRoutes);
console.log('🔍 DEBUG: Mounting calls routes...');
app.use(`${API_VERSION}/calls`, callRoutes);
console.log('🔍 DEBUG: Mounting rules routes...');
app.use(`${API_VERSION}/rules`, ruleRoutes);
console.log('🔍 DEBUG: Mounting reports routes...');
app.use(`${API_VERSION}/reports`, reportRoutes);
console.log('🔍 DEBUG: Mounting sales routes...');
app.use(`${API_VERSION}/sales`, salesRoutes);
console.log('🔍 DEBUG: Mounting coaching routes...');
app.use(`${API_VERSION}/coaching`, coachingRoutes);
// app.use(`${API_VERSION}/queue`, queueRoutes); // Temporarily disabled - Redis not running
console.log('🔍 DEBUG: Mounting audit-logs routes...');
app.use(`${API_VERSION}/audit-logs`, auditLogRoutes);
console.log('🔍 DEBUG: Mounting subscriptions routes...');
app.use(`${API_VERSION}/subscriptions`, subscriptionRoutes);
console.log('✅ DEBUG: API routes mounted');

// RunPod GPU Control API
console.log('🚀 DEBUG: Registering RunPod routes at path:', `${API_VERSION}/runpod`);
app.use(`${API_VERSION}/runpod`, runpodRoutes);
console.log('✅ DEBUG: RunPod routes registered successfully at', `${API_VERSION}/runpod`);
// List all registered routes
if (runpodRoutes.stack) {
  console.log('📋 DEBUG: RunPod routes:');
  runpodRoutes.stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
      console.log(`   ${methods} ${API_VERSION}/runpod${layer.route.path}`);
    }
  });
}

// Legacy routes (deprecated - redirect to v1)
console.log('🔍 DEBUG: Setting up legacy routes...');
app.use('/api/auth', (req, res) => res.redirect(308, `${API_VERSION}/auth${req.url}`));
app.use('/api/calls', (req, res) => res.redirect(308, `${API_VERSION}/calls${req.url}`));
app.use('/api/rules', (req, res) => res.redirect(308, `${API_VERSION}/rules${req.url}`));
app.use('/api/reports', (req, res) => res.redirect(308, `${API_VERSION}/reports${req.url}`));
app.use('/api/sales', (req, res) => res.redirect(308, `${API_VERSION}/sales${req.url}`));
app.use('/api/coaching', (req, res) => res.redirect(308, `${API_VERSION}/coaching${req.url}`));
app.use('/api/audit-logs', (req, res) => res.redirect(308, `${API_VERSION}/audit-logs${req.url}`));
// app.use('/api/subscriptions', (req, res) => res.redirect(308, `${API_VERSION}/subscriptions${req.url}`)); // Temporarily disabled for testing
console.log('✅ DEBUG: Legacy routes set up');

// Debug: Log all incoming requests
console.log('🔍 DEBUG: Setting up debug middleware...');
app.use((req, res, next) => {
  if (req.path.includes('/runpod')) {
    console.log('🔍 DEBUG: Incoming request to RunPod route:');
    console.log('   Method:', req.method);
    console.log('   Path:', req.path);
    console.log('   Original URL:', req.originalUrl);
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
  }
  next();
});
console.log('✅ DEBUG: Debug middleware set up');

// 404 Handler
console.log('🔍 DEBUG: Setting up 404 handler...');
app.use('*', (req, res) => {
  console.log('❌ DEBUG: 404 - Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});
console.log('✅ DEBUG: 404 handler set up');

// Error handling middleware (must be last)
console.log('🔍 DEBUG: Setting up error handling middleware...');
app.use(errorHandler);
console.log('✅ DEBUG: Error handling middleware set up');

// Start server
const PORT = config.port;
console.log('🔍 DEBUG: Config port value:', PORT);
console.log('🔍 DEBUG: Config object:', JSON.stringify(config, null, 2));
console.log('🔍 DEBUG: About to start server on port:', PORT);

const server = app.listen(PORT, () => {
  console.log('✅ DEBUG: Server started successfully on port:', PORT);
  logger.info('Server started successfully', { 
    environment: config.nodeEnv,
    port: PORT,
    apiVersion: '/api/v1'
  });
  
  // Start scheduled jobs
  fileCleanupJob.start();
  
  // Initialize subscription management cron jobs
  try {
    subscriptionExpiration.initSubscriptionJobs();
    logger.info('Subscription expiration cron jobs initialized');
  } catch (error) {
    logger.error('Failed to initialize subscription cron jobs', { error: error.message });
  }
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
console.log('🔍 DEBUG: Setting up graceful shutdown handlers...');
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
console.log('✅ DEBUG: Graceful shutdown handlers set up');

module.exports = app;
