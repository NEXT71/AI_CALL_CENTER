const express = require('express');
const router = express.Router();
const runpodController = require('../controllers/runpodController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('Admin'));

router.get('/status', runpodController.getStatus);
router.post('/start', runpodController.startPod);
router.post('/stop', runpodController.stopPod);
router.get('/list', runpodController.listPods);

module.exports = router;
