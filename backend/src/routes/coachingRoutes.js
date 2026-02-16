const express = require('express');
const router = express.Router();
const coachingController = require('../controllers/coachingController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Generate coaching recommendations for a call
router.post('/generate/:callId', coachingController.generateCoaching);

// Get coaching recommendations for a call
router.get('/:callId', coachingController.getCoaching);

// Update manager notes
router.put('/:callId/manager-notes', coachingController.updateManagerNotes);

// Get coaching statistics
router.get('/stats/agent/:agentId', coachingController.getAgentCoachingStats);
router.get('/stats/company', coachingController.getCompanyCoachingStats);

// Delete coaching recommendations (admin only)
router.delete('/:callId', coachingController.deleteCoaching);

module.exports = router;
