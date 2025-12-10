const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getQueueStats, getJobStatus } = require('../queues/callProcessingQueue');

/**
 * @route   GET /api/queue/stats
 * @desc    Get queue statistics
 * @access  Private
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve queue statistics',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/queue/job/:callId
 * @desc    Get job status for a specific call
 * @access  Private
 */
router.get('/job/:callId', auth, async (req, res) => {
  try {
    const { callId } = req.params;
    const job = await getJobStatus(callId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.json({
      success: true,
      job: {
        id: job.id,
        state: await job.getState(),
        progress: job.progress(),
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job status',
      error: error.message,
    });
  }
});

module.exports = router;
