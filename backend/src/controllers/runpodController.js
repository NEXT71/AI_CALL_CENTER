const runpodService = require('../services/runpodService');
const auditService = require('../services/auditService');
const logger = require('../config/logger');

console.log('🚀 DEBUG: runpodController.js - Module loading');
console.log('🔍 DEBUG: runpodService.isConfigured:', typeof runpodService.isConfigured);

/**
 * @route   GET /api/v1/runpod/status
 * @desc    Get RunPod status
 * @access  Private (Admin only)
 */
exports.getStatus = async (req, res, next) => {
  console.log('🎯 DEBUG: getStatus controller called');
  console.log('🔍 DEBUG: User:', req.user?.email, 'Role:', req.user?.role);
  
  try {
    console.log('🔍 DEBUG: Checking RunPod configuration...');
    if (!runpodService.isConfigured()) {
      console.log('⚠️ DEBUG: RunPod not configured');
      return res.status(400).json({
        success: false,
        message: 'RunPod not configured. Please set RUNPOD_API_KEY and RUNPOD_POD_ID in environment variables.',
      });
    }

    console.log('🔍 DEBUG: Fetching pod status...');
    const podStatus = await runpodService.getPodStatus();
    console.log('✅ DEBUG: Pod status retrieved:', podStatus?.id);

    res.status(200).json({
      success: true,
      data: {
        id: podStatus.id,
        name: podStatus.name,
        status: podStatus.desiredStatus,
        runtime: podStatus.runtime,
        gpu: {
          name: podStatus.machine?.gpuDisplayName,
          count: podStatus.machine?.gpuCount,
        },
        costPerHr: podStatus.costPerHr,
        uptimeInSeconds: podStatus.uptimeInSeconds,
        resources: {
          memory: podStatus.memoryInGb,
          vcpu: podStatus.vcpuCount,
          storage: podStatus.volumeInGb,
        },
        ports: podStatus.ports,
      },
    });
  } catch (error) {
    logger.error('Error getting RunPod status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get pod status',
    });
  }
};

/**
 * @route   POST /api/v1/runpod/start
 * @desc    Start RunPod
 * @access  Private (Admin only)
 */
exports.startPod = async (req, res, next) => {
  try {
    if (!runpodService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'RunPod not configured',
      });
    }

    const result = await runpodService.startPod();

    // Log action
    await auditService.createAuditLog({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RUNPOD_START',
      resourceType: 'RunPod',
      details: { podId: result.id },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    res.status(200).json({
      success: true,
      message: 'Pod starting... It may take 1-2 minutes to become ready.',
      data: {
        id: result.id,
        status: result.desiredStatus,
        costPerHr: result.costPerHr,
      },
    });
  } catch (error) {
    logger.error('Error starting RunPod:', error);
    
    // Log failed action
    await auditService.createAuditLog({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RUNPOD_START',
      resourceType: 'RunPod',
      details: { error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'failure',
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start pod',
    });
  }
};

/**
 * @route   POST /api/v1/runpod/stop
 * @desc    Stop RunPod
 * @access  Private (Admin only)
 */
exports.stopPod = async (req, res, next) => {
  try {
    if (!runpodService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'RunPod not configured',
      });
    }

    const result = await runpodService.stopPod();

    // Log action
    await auditService.createAuditLog({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RUNPOD_STOP',
      resourceType: 'RunPod',
      details: { podId: result.id },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    res.status(200).json({
      success: true,
      message: 'Pod stopped successfully. This will reduce costs while not in use.',
      data: {
        id: result.id,
        status: result.desiredStatus,
      },
    });
  } catch (error) {
    logger.error('Error stopping RunPod:', error);
    
    // Log failed action
    await auditService.createAuditLog({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RUNPOD_STOP',
      resourceType: 'RunPod',
      details: { error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'failure',
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to stop pod',
    });
  }
};

/**
 * @route   GET /api/v1/runpod/list
 * @desc    List all RunPods
 * @access  Private (Admin only)
 */
exports.listPods = async (req, res, next) => {
  try {
    if (!runpodService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'RunPod not configured',
      });
    }

    const pods = await runpodService.listAllPods();

    res.status(200).json({
      success: true,
      data: pods.map(pod => ({
        id: pod.id,
        name: pod.name,
        status: pod.desiredStatus,
        runtime: pod.runtime,
        costPerHr: pod.costPerHr,
        uptimeInSeconds: pod.uptimeInSeconds,
        gpu: {
          name: pod.machine?.gpuDisplayName,
          count: pod.machine?.gpuCount,
        },
      })),
    });
  } catch (error) {
    logger.error('Error listing RunPods:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list pods',
    });
  }
};

/**
 * Start AI service on pod
 */
exports.startService = async (req, res) => {
  try {
    console.log('🎯 DEBUG: startService controller called');
    console.log('🔍 DEBUG: User:', req.user.email, 'Role:', req.user.role);

    if (!runpodService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'RunPod not configured',
      });
    }

    const result = await runpodService.startService();

    // Log action
    await auditService.createAuditLog({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RUNPOD_SERVICE_START',
      resourceType: 'RunPod',
      details: { result },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    logger.error('Error starting AI service:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start AI service',
    });
  }
};

/**
 * Stop AI service on pod
 */
exports.stopService = async (req, res) => {
  try {
    console.log('🎯 DEBUG: stopService controller called');
    console.log('🔍 DEBUG: User:', req.user.email, 'Role:', req.user.role);

    if (!runpodService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'RunPod not configured',
      });
    }

    const result = await runpodService.stopService();

    // Log action
    await auditService.createAuditLog({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RUNPOD_SERVICE_STOP',
      resourceType: 'RunPod',
      details: { result },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    logger.error('Error stopping AI service:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to stop AI service',
    });
  }
};

/**
 * Get AI service status
 */
exports.getServiceStatus = async (req, res) => {
  try {
    console.log('🎯 DEBUG: getServiceStatus controller called');
    console.log('🔍 DEBUG: User:', req.user.email, 'Role:', req.user.role);

    if (!runpodService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'RunPod not configured',
      });
    }

    const result = await runpodService.getServiceStatus();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get service status',
    });
  }
};
