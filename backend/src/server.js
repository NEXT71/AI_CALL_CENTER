const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/authRoutes');
const callRoutes = require('./routes/callRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Call Center API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/reports', reportRoutes);

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

app.listen(PORT, () => {
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;
