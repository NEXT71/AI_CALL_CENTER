const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const auditLogController = require('../controllers/auditLogController');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/audit-logs
 * @desc    Get all audit logs with filters
 * @access  Private (Admin only)
 */
router.get('/', authorize('Admin'), auditLogController.getAuditLogs);

/**
 * @route   GET /api/audit-logs/stats
 * @desc    Get audit log statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authorize('Admin'), auditLogController.getAuditStats);

/**
 * @route   GET /api/audit-logs/user/:userId
 * @desc    Get audit logs for specific user
 * @access  Private (Admin or own logs)
 */
router.get('/user/:userId', auditLogController.getUserAuditLogs);

/**
 * @route   GET /api/audit-logs/resource/:resourceType/:resourceId
 * @desc    Get audit logs for specific resource
 * @access  Private
 */
router.get(
  '/resource/:resourceType/:resourceId',
  auditLogController.getResourceAuditLogs
);

module.exports = router;
