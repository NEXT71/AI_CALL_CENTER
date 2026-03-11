const Queue = require('bull');
const logger = require('../config/logger');
const Call = require('../models/Call');
const aiService = require('../services/aiService');
const scoringService = require('../services/scoringService');
const fs = require('fs');

/**
 * Retry wrapper for AI service calls
 * @param {Function} fn - The function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} - Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 2, delay = 5000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.message.includes('unavailable') || 
          error.message.includes('not found') ||
          error.message.includes('Invalid')) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt);
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms`, {
          error: error.message,
        });
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

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
    lockDuration: 3600000, // 60 minutes for long audio processing
  },
  defaultJobOptions: {
    attempts: 2, // Reduced to 2 attempts (initial + 1 retry)
    backoff: {
      type: 'exponential',
      delay: 10000, // 10 seconds initial delay
    },
    timeout: 3600000, // 60 minutes timeout for entire job
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

    // Step 1: Combined Transcription + Diarization (with retry)
    let transcription;
    let diarizationData = {};
    
    try {
      // Try the new combined endpoint first (more efficient)
      const combined = await retryWithBackoff(
        () => aiService.transcribeWithSpeakers(audioPath),
        2,  // 2 retries
        10000  // 10 second delay
      );
      
      if (!combined || !combined.text) {
        throw new Error('Combined transcription returned empty result');
      }
      
      // Extract transcription data
      transcription = {
        text: combined.text,
        timestamps: combined.timestamps,
        language: combined.language,
        duration: combined.duration,
        word_count: combined.word_count,
        speaker_labeled_text: combined.speaker_labeled_text, // New! Text with Agent:/Customer: labels
      };
      
      // Extract diarization data
      diarizationData = {
        speakers: combined.speakers,
        speaker_segments: combined.speaker_segments,
        num_speakers: combined.speakers.length,
      };
      
      // Calculate talk-time metrics if we have speaker segments
      if (diarizationData.speaker_segments && diarizationData.speaker_segments.length > 0) {
        try {
          const talkTimeData = await aiService.calculateTalkTime(audioPath, diarizationData.speaker_segments);
          diarizationData = { ...diarizationData, ...talkTimeData };
        } catch (talkTimeError) {
          logger.warn('Talk-time calculation failed, continuing without it', {
            callId,
            error: talkTimeError.message,
          });
        }
      }
      
      logger.info('Combined transcription+diarization completed', {
        callId,
        textLength: transcription.text.length,
        wordCount: transcription.word_count,
        speakers: diarizationData.speakers,
      });
      
    } catch (combinedError) {
      // Fallback to separate calls if combined endpoint fails
      logger.warn('Combined endpoint failed, falling back to separate transcription', {
        callId,
        error: combinedError.message,
      });
      
      transcription = await retryWithBackoff(
        () => aiService.transcribeAudio(audioPath),
        2,
        10000
      );
      
      if (!transcription || !transcription.text) {
        throw new Error('Transcription returned empty result');
      }
      
      logger.info('Transcription completed (fallback)', {
        callId,
        textLength: transcription.text.length,
        wordCount: transcription.text.split(/\s+/).length,
      });
      
      // Try diarization separately
      try {
        diarizationData = await aiService.diarizeAudio(audioPath);
        if (diarizationData.speakers && diarizationData.speaker_segments) {
          try {
            const talkTimeData = await aiService.calculateTalkTime(audioPath, diarizationData.speaker_segments);
            diarizationData = { ...diarizationData, ...talkTimeData };
          } catch (talkTimeError) {
            logger.warn('Talk-time calculation failed', { callId, error: talkTimeError.message });
          }
        }
      } catch (diarizationError) {
        logger.warn('Diarization failed, continuing without it', {
          callId,
          error: diarizationError.message,
        });
        diarizationData = {
          speakers: [],
          speaker_segments: [],
          agentTalkTime: 0,
          customerTalkTime: 0,
          talkTimeRatio: 'N/A',
          deadAirTotal: 0,
          deadAirSegments: [],
        };
      }
    }
    
    await job.progress(40);

    // Step 3: Sentiment analysis
    let sentiment = { sentiment: 'neutral', score: 0.5 };
    try {
      sentiment = await aiService.analyzeSentiment(transcription.text);
    } catch (error) {
      logger.warn('Sentiment analysis failed, using default', {
        callId,
        error: error.message,
      });
    }
    await job.progress(55);

    // Step 4: Entity extraction (DISABLED for speed - rarely used in QA)
    let entities = [];
    // Uncomment below to enable entity extraction (adds 10-15 seconds)
    /*
    try {
      const entityData = await aiService.extractEntities(transcription.text);
      entities = entityData.entities || [];
    } catch (error) {
      logger.warn('Entity extraction failed, continuing without entities', { 
        callId, 
        error: error.message 
      });
    }
    */
    await job.progress(65);

    // Step 5: Summarization (if text is long enough)
    let summary = '';
    if (transcription.text && transcription.text.length > 200) {
      try {
        const summaryData = await aiService.summarizeText(transcription.text);
        summary = summaryData.summary || '';
      } catch (error) {
        logger.warn('Summarization failed, continuing without summary', { 
          callId, 
          error: error.message 
        });
        // Fallback: use first 500 characters as summary
        summary = transcription.text.substring(0, 500) + '...';
      }
    }
    await job.progress(75);

    // Step 6: Compliance check
    const callData = await Call.findById(callId);
    const complianceResult = await scoringService.checkCompliance(
      transcription.text,
      callData.campaign
    );
    await job.progress(75);

    // Step 7: AI Quality scoring (NEW - uses 6 AI factors instead of traditional metrics)
    let qualityResult = {
      overall_score: 0,
      factors: {},
      details: {},
      flags: {},
    };
    
    try {
      qualityResult = await aiService.calculateQualityScore(
        transcription.text,
        transcription.speaker_labeled_text,
        transcription.language || 'english'
      );
      logger.info('AI quality scoring completed', {
        callId,
        overallScore: qualityResult.overall_score,
        factors: qualityResult.factors,
      });
    } catch (error) {
      logger.warn('AI quality scoring failed, using fallback', {
        callId,
        error: error.message,
      });
      
      // Analyze per-speaker sentiment for fallback scoring
      let fallbackAgentSentiment = sentiment.sentiment || 'neutral';
      try {
        if (transcription.speaker_labeled_text) {
          const perSpeakerSentiment = await aiService.analyzePerSpeakerSentiment(transcription.speaker_labeled_text);
          fallbackAgentSentiment = perSpeakerSentiment.agent_sentiment || sentiment.sentiment || 'neutral';
        }
      } catch (sentError) {
        logger.warn('Per-speaker sentiment failed in fallback, using overall sentiment', { error: sentError.message });
      }
      
      // Fallback to traditional scoring if AI service fails (using agent sentiment, not overall)
      const fallbackQuality = scoringService.calculateQualityScore({
        transcript: transcription.text,
        sentiment: fallbackAgentSentiment,
        complianceScore: complianceResult.score,
        duration: callData.duration,
        talkTimeRatio: diarizationData.agent_customer_ratio || diarizationData.talkTimeRatio || '',
        deadAirTotal: diarizationData.dead_air_total || diarizationData.deadAirTotal || 0,
      });
      qualityResult = {
        overall_score: fallbackQuality.score,
        factors: {},
        details: {},
        flags: {},
      };
    }
    await job.progress(90);

    // Step 8: Per-speaker sentiment analysis (NEW)
    let agentSentimentResult = sentiment.sentiment || 'neutral';
    let customerSentimentResult = 'neutral';
    
    if (transcription.speaker_labeled_text) {
      try {
        const perSpeakerSentiment = await aiService.analyzePerSpeakerSentiment(
          transcription.speaker_labeled_text
        );
        agentSentimentResult = perSpeakerSentiment.agent_sentiment || sentiment.sentiment || 'neutral';
        customerSentimentResult = perSpeakerSentiment.customer_sentiment || 'neutral';
        logger.info('Per-speaker sentiment completed', {
          callId,
          agentSentiment: agentSentimentResult,
          customerSentiment: customerSentimentResult,
        });
      } catch (error) {
        logger.warn('Per-speaker sentiment failed, using defaults', {
          callId,
          error: error.message,
        });
      }
    }
    await job.progress(95);

    // Update call with all results (including AI quality metrics)
    const updatedCall = await Call.findByIdAndUpdate(
      callId,
      {
        transcript: transcription.text,
        speakerLabeledTranscript: transcription.speaker_labeled_text || '',
        transcriptTimestamps: transcription.timestamps || [],
        speakerSegments: diarizationData.speaker_segments || [],
        speakers: diarizationData.speakers || [],
        agentTalkTime: diarizationData.agentTalkTime || 0,
        customerTalkTime: diarizationData.customerTalkTime || 0,
        talkTimeRatio: diarizationData.agent_customer_ratio || diarizationData.talkTimeRatio || '',
        deadAirTotal: diarizationData.dead_air_total || diarizationData.deadAirTotal || 0,
        deadAirSegments: diarizationData.dead_air_segments || diarizationData.deadAirSegments || [],
        agentSentiment: agentSentimentResult,
        customerSentiment: customerSentimentResult,
        // Use agent sentiment for main sentiment field (we're evaluating agent performance)
        sentiment: agentSentimentResult,
        sentimentScore: sentiment.score || 0.5,
        entities,
        summary,
        wordCount: transcription.text ? transcription.text.split(/\s+/).length : 0,
        complianceScore: complianceResult.score,
        missingMandatoryPhrases: complianceResult.missingMandatory,
        detectedForbiddenPhrases: complianceResult.detectedForbidden,
        // AI Quality Scoring (NEW)
        qualityScore: Math.round(qualityResult.overall_score || 0),
        qualityMetrics: {
          // Keep traditional metrics for backward compatibility
          hasGreeting: complianceResult.hasGreeting || false,
          hasProperClosing: complianceResult.hasProperClosing || false,
          complianceLinesSpoken: complianceResult.score >= 90,
          agentInterruptionCount: 0,
          avgSpeechRate: transcription.text ? Math.round((transcription.text.split(/\s+/).length / (callData.duration / 60))) : 0,
          // AI-based quality factors (6 factors)
          aiFactors: qualityResult.factors || {},
          aiDetails: qualityResult.details || {},
          aiFlags: qualityResult.flags || {},
        },
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
      qualityScore: Math.round(qualityResult.overall_score || 0),
      complianceScore: complianceResult.score,
      agentSentiment: agentSentimentResult,
      customerSentiment: customerSentimentResult,
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

callQueue.getQueueStats = exports.getQueueStats;
callQueue.getJobStatus = exports.getJobStatus;
callQueue.cleanQueue = exports.cleanQueue;

module.exports = callQueue;
