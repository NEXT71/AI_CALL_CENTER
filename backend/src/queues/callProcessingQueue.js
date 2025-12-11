const Queue = require('bull');
const logger = require('../config/logger');
const Call = require('../models/Call');
const aiService = require('../services/aiService');
const scoringService = require('../services/scoringService');
const fs = require('fs');

// Create processing queue
const callQueue = new Queue('call-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
      // Stop retrying after 3 attempts to prevent infinite loop
      if (times > 3) {
        logger.warn('Redis connection failed after 3 attempts. Queue functionality disabled.');
        return null; // Stop retrying
      }
      return Math.min(times * 1000, 3000);
    },
  },
  settings: {
    maxStalledCount: 3,
    stalledInterval: 30000,
    lockDuration: 300000, // 5 minutes
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: false,
  },
});

// Handle Redis connection errors gracefully
callQueue.on('error', (error) => {
  logger.error('Queue error', { error: error.message });
  // Don't crash the app - queue functionality will be disabled
});

callQueue.on('failed', (job, err) => {
  logger.error('Job failed', { jobId: job.id, error: err.message });
});

/**
 * Add call to processing queue
 */
exports.queueCallProcessing = async (callId, audioPath, metadata = {}) => {
  try {
    const job = await callQueue.add(
      {
        callId: callId.toString(),
        audioPath,
        metadata,
        queuedAt: Date.now(),
      },
      {
        jobId: `call-${callId}`,
        priority: metadata.priority || 5,
      }
    );

    logger.info('Call queued for processing', {
      callId,
      jobId: job.id,
      position: await job.getPosition(),
    });

    return job.id;
  } catch (error) {
    logger.error('Failed to queue call', { callId, error: error.message });
    throw error;
  }
};

/**
 * Process call (full AI pipeline)
 */
async function processCall(job) {
  const { callId, audioPath } = job.data;
  const startTime = Date.now();

  try {
    logger.info('Processing call started', { callId, jobId: job.id });

    // Verify call is a sale before processing
    const call = await Call.findById(callId);
    if (!call) {
      throw new Error('Call not found');
    }

    if (!call.isSale || !call.requiresQA) {
      logger.info('Skipping non-sale call', { 
        callId, 
        isSale: call.isSale,
        requiresQA: call.requiresQA,
      });
      await Call.findByIdAndUpdate(callId, { 
        status: 'skipped',
        processingError: 'Not a sale call - skipped processing',
        processedAt: new Date(),
      });
      return { skipped: true, reason: 'not_a_sale' };
    }

    logger.info('Processing SALE call', {
      callId,
      saleAmount: call.saleAmount,
      productSold: call.productSold,
      jobId: job.id,
    });

    // Update status
    await Call.findByIdAndUpdate(callId, {
      status: 'processing',
      processingStartedAt: new Date(),
    });

    // Report progress
    await job.progress(10);

    // Step 1: Transcription
    const transcription = await aiService.transcribeAudio(audioPath);
    await job.progress(25);

    // Step 2: Speaker diarization
    let diarizationData = {};
    try {
      diarizationData = await aiService.diarizeAudio(audioPath);
      if (diarizationData.speakers && diarizationData.segments) {
        const talkTimeData = await aiService.calculateTalkTime(diarizationData.segments);
        diarizationData = { ...diarizationData, ...talkTimeData };
      }
    } catch (error) {
      logger.warn('Diarization failed, continuing without it', {
        callId,
        error: error.message,
      });
    }
    await job.progress(40);

    // Step 3: Sentiment analysis
    const sentiment = await aiService.analyzeSentiment(transcription.text);
    await job.progress(55);

    // Step 4: Entity extraction
    let entities = [];
    try {
      const entityData = await aiService.extractEntities(transcription.text);
      entities = entityData.entities || [];
    } catch (error) {
      logger.warn('Entity extraction failed', { callId, error: error.message });
    }
    await job.progress(65);

    // Step 5: Summarization (if text is long enough)
    let summary = '';
    if (transcription.text.length > 200) {
      try {
        const summaryData = await aiService.summarizeText(transcription.text);
        summary = summaryData.summary || '';
      } catch (error) {
        logger.warn('Summarization failed', { callId, error: error.message });
      }
    }
    await job.progress(75);

    // Step 6: Compliance check
    const callData = await Call.findById(callId);
    const complianceResult = await scoringService.checkCompliance(
      transcription.text,
      callData.campaign
    );
    await job.progress(85);

    // Step 7: Quality scoring
    const qualityResult = scoringService.calculateQualityScore({
      transcription: transcription.text,
      sentiment: diarizationData.agentSentiment || sentiment.sentiment,
      duration: callData.duration,
      hasGreeting: complianceResult.hasGreeting,
      hasProperClosing: complianceResult.hasProperClosing,
      agentTalkTime: diarizationData.agentTalkTime,
      customerTalkTime: diarizationData.customerTalkTime,
      deadAirTotal: diarizationData.deadAirTotal,
    });
    await job.progress(95);

    // Update call with all results
    const updatedCall = await Call.findByIdAndUpdate(
      callId,
      {
        transcription: transcription.text,
        speakerSegments: diarizationData.segments || [],
        speakers: diarizationData.speakers || [],
        agentTalkTime: diarizationData.agentTalkTime || 0,
        customerTalkTime: diarizationData.customerTalkTime || 0,
        talkTimeRatio: diarizationData.talkTimeRatio || '',
        deadAirTotal: diarizationData.deadAirTotal || 0,
        deadAirSegments: diarizationData.deadAirSegments || [],
        agentSentiment: diarizationData.agentSentiment || sentiment.sentiment,
        customerSentiment: diarizationData.customerSentiment || '',
        sentiment: sentiment.sentiment,
        sentimentScore: sentiment.score,
        entities,
        summary,
        wordCount: transcription.text.split(/\s+/).length,
        complianceScore: complianceResult.score,
        missingMandatoryPhrases: complianceResult.missingMandatory,
        detectedForbiddenPhrases: complianceResult.detectedForbidden,
        qualityScore: qualityResult.score,
        qualityMetrics: qualityResult.metrics,
        status: 'completed',
        processedAt: new Date(),
        processingDuration: Date.now() - startTime,
      },
      { new: true }
    );

    await job.progress(100);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info('Call processed successfully', {
      callId,
      jobId: job.id,
      duration: `${duration}s`,
      qualityScore: qualityResult.score,
      complianceScore: complianceResult.score,
    });

    return updatedCall;
  } catch (error) {
    logger.error('Call processing failed', {
      callId,
      jobId: job.id,
      error: error.message,
      stack: error.stack,
    });

    // Update call with error
    await Call.findByIdAndUpdate(callId, {
      status: 'failed',
      processingError: error.message,
      processedAt: new Date(),
    });

    throw error;
  }
}

/**
 * Process jobs with concurrency
 * Concurrency depends on hardware:
 * - CPU only: 1-2
 * - Single GPU: 2-4
 * - Multiple GPUs: 4-8
 */
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY) || 2;

callQueue.process(CONCURRENCY, processCall);

// Event handlers
callQueue.on('completed', (job, result) => {
  logger.info('Job completed', {
    jobId: job.id,
    callId: job.data.callId,
    duration: `${((Date.now() - job.data.queuedAt) / 1000).toFixed(2)}s`,
  });
});

callQueue.on('failed', (job, err) => {
  logger.error('Job failed', {
    jobId: job.id,
    callId: job.data.callId,
    attempt: job.attemptsMade,
    maxAttempts: job.opts.attempts,
    error: err.message,
  });
});

callQueue.on('stalled', (job) => {
  logger.warn('Job stalled', {
    jobId: job.id,
    callId: job.data.callId,
  });
});

callQueue.on('error', (error) => {
  logger.error('Queue error', { error: error.message });
});

callQueue.on('waiting', (jobId) => {
  logger.debug('Job waiting', { jobId });
});

/**
 * Get queue statistics
 */
exports.getQueueStats = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    callQueue.getWaitingCount(),
    callQueue.getActiveCount(),
    callQueue.getCompletedCount(),
    callQueue.getFailedCount(),
    callQueue.getDelayedCount(),
  ]);

  const jobs = await callQueue.getJobs(['waiting', 'active']);
  const avgProcessingTime = jobs.length > 0
    ? jobs
        .filter((j) => j.finishedOn && j.processedOn)
        .reduce((sum, j) => sum + (j.finishedOn - j.processedOn), 0) / jobs.length / 1000
    : 0;

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
    avgProcessingTime: `${avgProcessingTime.toFixed(2)}s`,
    concurrency: CONCURRENCY,
  };
};

/**
 * Get job status
 */
exports.getJobStatus = async (jobId) => {
  const job = await callQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress();

  return {
    jobId: job.id,
    callId: job.data.callId,
    state,
    progress,
    attempts: job.attemptsMade,
    timestamp: job.timestamp,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
  };
};

/**
 * Clean old completed jobs
 */
exports.cleanQueue = async (grace = 86400000) => {
  // Clean jobs older than grace period (default 24 hours)
  await callQueue.clean(grace, 'completed');
  await callQueue.clean(grace * 7, 'failed'); // Keep failed jobs for 7 days
  
  logger.info('Queue cleaned', { grace });
};

module.exports = callQueue;
