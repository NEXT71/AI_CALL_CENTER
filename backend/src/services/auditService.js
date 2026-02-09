const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

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
    logger.error('Audit log creation failed', { error: error.message });
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

/**
 * Log user deactivation
 */
exports.logUserDeactivation = async (admin, deactivatedUser, req) => {
  return exports.createAuditLog({
    userId: admin._id,
    userName: admin.name,
    userRole: admin.role,
    action: 'DELETE_USER',
    resourceType: 'User',
    resourceId: deactivatedUser._id,
    details: {
      deactivatedUserName: deactivatedUser.name,
      deactivatedUserEmail: deactivatedUser.email,
      deactivatedUserRole: deactivatedUser.role,
    },
    req,
  });
};

/**
 * Log user update
 */
exports.logUserUpdate = async (admin, updatedUser, updateData, req) => {
  return exports.createAuditLog({
    userId: admin._id,
    userName: admin.name,
    userRole: admin.role,
    action: 'UPDATE_USER',
    resourceType: 'User',
    resourceId: updatedUser._id,
    details: {
      updatedUserName: updatedUser.name,
      updatedUserEmail: updatedUser.email,
      updatedUserRole: updatedUser.role,
      changes: updateData,
    },
    req,
  });
};

/**
 * Log logout
 */
exports.logLogout = async (user, req) => {
  return exports.createAuditLog({
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action: 'LOGOUT',
    resourceType: 'Auth',
    req,
  });
};

/**
 * Log email verification
 */
exports.logEmailVerification = async (user, req) => {
  return exports.createAuditLog({
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action: 'UPLOAD_CALL', // Using existing action since EMAIL_VERIFIED not in enum
    resourceType: 'User',
    resourceId: user._id,
    details: {
      action: 'EMAIL_VERIFIED',
      email: user.email,
    },
    req,
  });
};

/**
 * Log password reset
 */
exports.logPasswordReset = async (admin, user, req) => {
  return exports.createAuditLog({
    userId: admin._id,
    userName: admin.name,
    userRole: admin.role,
    action: 'UPDATE_USER',
    resourceType: 'User',
    resourceId: user._id,
    details: {
      action: 'PASSWORD_RESET',
      targetUserName: user.name,
      targetUserEmail: user.email,
    },
    req,
  });
};

/**
 * Log compliance rule creation
 */
exports.logRuleCreation = async (user, rule, req) => {
  return exports.createAuditLog({
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action: 'CREATE_RULE',
    resourceType: 'ComplianceRule',
    resourceId: rule._id,
    details: {
      ruleName: rule.name,
      ruleType: rule.type,
    },
    req,
  });
};

/**
 * Log compliance rule update
 */
exports.logRuleUpdate = async (user, rule, req) => {
  return exports.createAuditLog({
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action: 'UPDATE_RULE',
    resourceType: 'ComplianceRule',
    resourceId: rule._id,
    details: {
      ruleName: rule.name,
      ruleType: rule.type,
    },
    req,
  });
};

/**
 * Log compliance rule deletion
 */
exports.logRuleDeletion = async (user, rule, req) => {
  return exports.createAuditLog({
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action: 'DELETE_RULE',
    resourceType: 'ComplianceRule',
    resourceId: rule._id,
    details: {
      ruleName: rule.name,
      ruleType: rule.type,
    },
    req,
  });
};
