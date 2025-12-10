const AuditLog = require('../models/AuditLog');

/**
 * Create audit log entry
 */
exports.createAuditLog = async ({
  userId,
  userName,
  userRole,
  action,
  resourceType,
  resourceId,
  details,
  req,
  status = 'success',
  errorMessage = null,
}) => {
  try {
    await AuditLog.create({
      userId,
      userName,
      userRole,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
      status,
      errorMessage,
    });
  } catch (error) {
    // Don't throw error - audit log failure shouldn't break the main operation
    console.error('Audit log creation failed:', error);
  }
};

/**
 * Log successful login
 */
exports.logLogin = async (user, req) => {
  return exports.createAuditLog({
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action: 'LOGIN',
    resourceType: 'Auth',
    req,
  });
};

/**
 * Log failed login attempt
 */
exports.logFailedLogin = async (email, req) => {
  return exports.createAuditLog({
    userId: null,
    userName: email,
    userRole: 'Unknown',
    action: 'FAILED_LOGIN',
    resourceType: 'Auth',
    details: { email },
    req,
    status: 'failure',
    errorMessage: 'Invalid credentials',
  });
};

/**
 * Log call upload
 */
exports.logCallUpload = async (user, call, req) => {
  return exports.createAuditLog({
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action: 'UPLOAD_CALL',
    resourceType: 'Call',
    resourceId: call._id,
    details: {
      callId: call.callId,
      agentName: call.agentName,
      campaign: call.campaign,
    },
    req,
  });
};

/**
 * Log call deletion
 */
exports.logCallDeletion = async (user, call, req) => {
  return exports.createAuditLog({
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action: 'DELETE_CALL',
    resourceType: 'Call',
    resourceId: call._id,
    details: {
      callId: call.callId,
      agentName: call.agentName,
    },
    req,
  });
};

/**
 * Log user registration
 */
exports.logUserRegistration = async (admin, newUser, req) => {
  return exports.createAuditLog({
    userId: admin?._id || newUser._id,
    userName: admin?.name || 'System',
    userRole: admin?.role || 'System',
    action: 'REGISTER',
    resourceType: 'User',
    resourceId: newUser._id,
    details: {
      newUserName: newUser.name,
      newUserEmail: newUser.email,
      newUserRole: newUser.role,
    },
    req,
  });
};
