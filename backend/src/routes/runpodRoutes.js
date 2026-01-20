const express = require('express');
const router = express.Router();

console.log('🚀 DEBUG: runpodRoutes.js - Starting to load module');

const runpodController = require('../controllers/runpodController');
console.log('✅ DEBUG: runpodController imported:', {
  getStatus: typeof runpodController.getStatus,
  startPod: typeof runpodController.startPod,
  stopPod: typeof runpodController.stopPod,
  listPods: typeof runpodController.listPods
});

const { protect, authorize } = require('../middleware/auth');
console.log('✅ DEBUG: Auth middleware imported');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('Admin'));
console.log('✅ DEBUG: Auth middleware applied to router');

router.get('/status', (req, res, next) => {
  console.log('📍 DEBUG: GET /status route hit');
  runpodController.getStatus(req, res, next);
});

router.post('/start', (req, res, next) => {
  console.log('📍 DEBUG: POST /start route hit');
  runpodController.startPod(req, res, next);
});

router.post('/stop', (req, res, next) => {
  console.log('📍 DEBUG: POST /stop route hit');
  runpodController.stopPod(req, res, next);
});

router.get('/list', (req, res, next) => {
  console.log('📍 DEBUG: GET /list route hit');
  runpodController.listPods(req, res, next);
});

// Service management routes
router.post('/service/start', (req, res, next) => {
  console.log('📍 DEBUG: POST /service/start route hit');
  runpodController.startService(req, res, next);
});

router.post('/service/stop', (req, res, next) => {
  console.log('📍 DEBUG: POST /service/stop route hit');
  runpodController.stopService(req, res, next);
});

router.get('/service/status', (req, res, next) => {
  console.log('📍 DEBUG: GET /service/status route hit');
  runpodController.getServiceStatus(req, res, next);
});

console.log('✅ DEBUG: runpodRoutes.js - All routes registered');

module.exports = router;
