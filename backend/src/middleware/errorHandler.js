const logger = require('../config/logger');
const { AppError } = require('../utils/errors');

/**
 * Central error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error with context
  logger.error('Request error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    statusCode: error.statusCode,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    error.message = `${field} already exists`;
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error.message = message;
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    error.message = err.code === 'LIMIT_FILE_SIZE' 
      ? 'File size exceeds limit' 
      : 'File upload error';
    error.statusCode = 400;
  }

  // Response - hide stack trace in production
  const response = {
    success: false,
    error: error.message || 'Server Error',
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err;
  }

  // For operational errors, include status
  if (err.isOperational) {
    response.status = err.status;
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
