const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry
 * @param {Object} data - Audit log data
 * @param {String} data.userId - User ID
 * @param {String} data.userName - User name
 * @param {String} data.userRole - User role
 * @param {String} data.action - Action performed
 * @param {String} data.resourceType - Type of resource
 * @param {String} data.resourceId - Resource ID
 * @param {Object} data.details - Additional details
 * @param {String} data.ipAddress - IP address
 * @param {String} data.userAgent - User agent
 * @param {String} data.status - success or failure
 * @param {String} data.errorMessage - Error message if failed
 */
const createAuditLog = async (data) => {
  try {
    await AuditLog.create(data);
  } catch (error) {
    // Don't throw error to prevent audit logging from breaking the application
    console.error('Audit logging failed:', error.message);
  }
};

/**
 * Middleware to automatically log certain actions
 * Should be applied after auth middleware
 */
const auditLogMiddleware = (action, resourceType = null) => {
  return async (req, res, next) => {
    // Store original res.json to capture response
    const originalJson = res.json;

    res.json = function (data) {
      // Log the action
      createAuditLog({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action,
        resourceType,
        resourceId: req.params.id || req.params.callId || req.params.ruleId || data?._id,
        details: {
          method: req.method,
          endpoint: req.originalUrl,
          body: sanitizeBody(req.body),
          params: req.params,
          query: req.query,
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failure',
        errorMessage: res.statusCode >= 400 ? data?.message : undefined,
      });

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Sanitize request body to remove sensitive data from logs
 */
const sanitizeBody = (body) => {
  if (!body) return {};

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret'];
  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * Log authentication events (login, logout, register, failed login)
 */
const logAuthEvent = async (req, action, status = 'success', errorMessage = null) => {
  try {
    await createAuditLog({
      userId: req.user?._id || req.body?.email || 'unknown',
      userName: req.user?.name || req.body?.name || 'unknown',
      userRole: req.user?.role || 'unknown',
      action,
      resourceType: 'Auth',
      details: {
        email: req.body?.email,
        endpoint: req.originalUrl,
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status,
      errorMessage,
    });
  } catch (error) {
    console.error('Auth logging failed:', error.message);
  }
};

module.exports = {
  createAuditLog,
  auditLogMiddleware,
  logAuthEvent,
};
