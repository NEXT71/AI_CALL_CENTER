const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

const logDir = process.env.LOG_DIR || './logs';
console.log('🔍 DEBUG: Logger initializing with logDir:', logDir);

// Ensure log directory exists (create if needed)
try {
  if (!fs.existsSync(logDir)) {
    console.log('🔍 DEBUG: Creating logs directory...');
    fs.mkdirSync(logDir, { recursive: true });
    console.log('✅ DEBUG: Logs directory created');
  } else {
    console.log('✅ DEBUG: Logs directory already exists');
  }
} catch (error) {
  // Silently fail if we can't create logs directory (e.g., read-only filesystem)
  console.warn('Warning: Could not create logs directory:', error.message);
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ai-call-center-backend' },
  transports: [],
  exceptionHandlers: [],
  rejectionHandlers: [],
});

// Try to add file transports (may fail on read-only filesystems)
try {
  logger.add(new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
  }));

  logger.add(new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
  }));

  logger.exceptions.handle(
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    })
  );

  logger.rejections.handle(
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    })
  );
} catch (error) {
  console.warn('Warning: Could not initialize file logging:', error.message);
}

// Always add console transport for visibility (development AND production)
logger.add(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
  })
);

// Create stream for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

console.log('✅ DEBUG: Logger fully initialized');
module.exports = logger;
