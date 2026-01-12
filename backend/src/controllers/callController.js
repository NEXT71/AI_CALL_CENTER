const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Call = require('../models/Call');
const config = require('../config/config');
const aiService = require('../services/aiService');
const scoringService = require('../services/scoringService');
const auditService = require('../services/auditService');
const runpodService = require('../services/runpodService');
const logger = require('../config/logger');

// Ensure upload directory exists
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.wav', '.mp3', '.m4a', '.ogg', '.flac', '.aac'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files (.wav, .mp3, .m4a, .ogg, .flac, .aac) are allowed.'));
  }
};

// Magic number (file signature) validation for audio files
const validateAudioFile = (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    
    // Debug: Log first 20 bytes
    const firstBytes = Array.from(buffer.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ');
    logger.info(`Audio validation - First 20 bytes: ${firstBytes}`, { filePath });
    
    // Check magic numbers for common audio formats
    const magicNumbers = {
      wav: [0x52, 0x49, 0x46, 0x46], // RIFF
      mp3: [0xFF, 0xFB], // MP3 frame sync (CBR)
      mp3_vbr: [0xFF, 0xF3], // MP3 frame sync (VBR)
      mp3_vbr2: [0xFF, 0xF2], // MP3 frame sync (VBR)
      mp3_id3: [0x49, 0x44, 0x33], // ID3v2
      m4a: [0x66, 0x74, 0x79, 0x70], // ftyp (at offset 4)
      ogg: [0x4F, 0x67, 0x67, 0x53], // OggS
      flac: [0x66, 0x4C, 0x61, 0x43], // fLaC
      aac: [0xFF, 0xF1], // AAC ADTS
    };
    
    // Check WAV
    if (buffer[0] === magicNumbers.wav[0] && buffer[1] === magicNumbers.wav[1] &&
        buffer[2] === magicNumbers.wav[2] && buffer[3] === magicNumbers.wav[3]) {
      logger.info('Audio validation - Detected WAV format');
      return true;
    }
    
    // Check MP3 (multiple possible signatures)
    // 1. ID3v2 tag at start
    if (buffer[0] === magicNumbers.mp3_id3[0] && buffer[1] === magicNumbers.mp3_id3[1] &&
        buffer[2] === magicNumbers.mp3_id3[2]) {
      logger.info('Audio validation - Detected MP3 with ID3 tag');
      return true;
    }
    
    // 2. Direct MP3 frame sync (check first few possible frame sync patterns)
    const frameSyncPatterns = [
      [0xFF, 0xFB], [0xFF, 0xFA], [0xFF, 0xF9], [0xFF, 0xF8], [0xFF, 0xF7],
      [0xFF, 0xF6], [0xFF, 0xF5], [0xFF, 0xF4], [0xFF, 0xF3], [0xFF, 0xF2],
      [0xFF, 0xF1], [0xFF, 0xF0], [0xFF, 0xEF], [0xFF, 0xEE], [0xFF, 0xED],
      [0xFF, 0xEC], [0xFF, 0xEB], [0xFF, 0xEA], [0xFF, 0xE9], [0xFF, 0xE8],
      [0xFF, 0xE7], [0xFF, 0xE6], [0xFF, 0xE5], [0xFF, 0xE4], [0xFF, 0xE3],
      [0xFF, 0xE2], [0xFF, 0xE1], [0xFF, 0xE0]
    ];
    
    // Search for frame sync in first 2000 bytes (increased for large ID3 tags)
    for (let i = 0; i < Math.min(2000, buffer.length - 1); i++) {
      for (const pattern of frameSyncPatterns) {
        if (buffer[i] === pattern[0] && (buffer[i + 1] & 0xE0) === pattern[1]) {
          logger.info(`Audio validation - Detected MP3 frame sync at offset ${i}: ${buffer[i].toString(16)} ${buffer[i+1].toString(16)}`);
          return true;
        }
      }
    }
    
    // 3. Check for MP3 frame sync anywhere in the file (last resort)
    for (let i = 0; i < Math.min(10000, buffer.length - 1); i++) {
      if ((buffer[i] & 0xFF) === 0xFF && (buffer[i + 1] & 0xE0) === 0xE0) {
        logger.info(`Audio validation - Detected MP3 frame sync (broad search) at offset ${i}`);
        return true;
      }
    }
    
    // Check M4A (ftyp at offset 4)
    if (buffer[4] === magicNumbers.m4a[0] && buffer[5] === magicNumbers.m4a[1] &&
        buffer[6] === magicNumbers.m4a[2] && buffer[7] === magicNumbers.m4a[3]) {
      logger.info('Audio validation - Detected M4A format');
      return true;
    }
    
    // Check OGG
    if (buffer[0] === magicNumbers.ogg[0] && buffer[1] === magicNumbers.ogg[1] &&
        buffer[2] === magicNumbers.ogg[2] && buffer[3] === magicNumbers.ogg[3]) {
      logger.info('Audio validation - Detected OGG format');
      return true;
    }
    
    // Check FLAC
    if (buffer[0] === magicNumbers.flac[0] && buffer[1] === magicNumbers.flac[1] &&
        buffer[2] === magicNumbers.flac[2] && buffer[3] === magicNumbers.flac[3]) {
      logger.info('Audio validation - Detected FLAC format');
      return true;
    }
    
    // Check AAC (ADTS header)
    if (buffer[0] === magicNumbers.aac[0] && (buffer[1] & 0xF0) === magicNumbers.aac[1]) {
      logger.info('Audio validation - Detected AAC format');
      return true;
    }
    
    logger.warn('Audio validation - No valid audio format detected');
    return false;
  } catch (error) {
    logger.error('Audio validation error', { error: error.message, filePath });
    return false;
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxSize },
});

/**
 * @route   POST /api/calls/upload
 * @desc    Upload call audio and create call record
 * @access  Private
 */
exports.uploadCall = [
  upload.single('audio'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Audio file is required',
        });
      }

      // Validate file content (magic number check)
      const isValidAudio = validateAudioFile(req.file.path);
      if (!isValidAudio) {
        logger.error('Audio file validation failed', {
          filename: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
        // Delete invalid file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Invalid audio file format. File content does not match extension.',
        });
      }

      const {
        agentId,
        agentName,
        customerId,
        customerName,
        campaign,
        duration,
        callDate,
        isSale,        // NEW: Was this call a sale?
        saleAmount,    // NEW: Sale amount (optional)
        productSold,   // NEW: Product sold (optional)
      } = req.body;

      // Validate sale data
      if (isSale === true || isSale === 'true') {
        if (!saleAmount || parseFloat(saleAmount) <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Sale amount is required for sale calls',
          });
        }
      }

      // Generate unique call ID
      const callId = `CALL-${Date.now()}-${uuidv4().substring(0, 8)}`;

      // Convert agentId string to ObjectId if needed
      let agentObjectId;
      try {
        // If agentId is a simple number string, create a valid ObjectId from it
        if (/^\d+$/.test(agentId)) {
          // Create a consistent ObjectId from numeric string by padding it
          const paddedId = agentId.padStart(24, '0');
          agentObjectId = new mongoose.Types.ObjectId(paddedId.substring(0, 24));
        } else {
          // Try to parse as existing ObjectId
          agentObjectId = new mongoose.Types.ObjectId(agentId);
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid agent ID format',
        });
      }

      // Create call record
      const call = await Call.create({
        callId,
        agentId: agentObjectId,
        agentName,
        customerId,
        customerName,
        campaign,
        duration: duration ? parseInt(duration) : 0,
        callDate: new Date(callDate),
        audioFilePath: req.file.path,
        audioFileName: req.file.filename,
        fileSize: req.file.size,
        uploadedBy: req.user._id,
        // Sale fields
        isSale: isSale === true || isSale === 'true',
        saleAmount: saleAmount ? parseFloat(saleAmount) : undefined,
        productSold: productSold || undefined,
        saleDate: (isSale === true || isSale === 'true') ? new Date(callDate) : undefined,
        requiresQA: (isSale === true || isSale === 'true'), // Only QA sale calls
        status: (isSale === true || isSale === 'true') ? 'queued' : 'skipped', // Skip non-sale calls
      });

      // Only trigger AI processing for SALE calls
      if (call.isSale && call.requiresQA) {
        logger.info(`Call ${callId} is a SALE - queuing for AI processing`, {
          saleAmount: call.saleAmount,
          productSold: call.productSold,
        });
        processCallAsync(call._id);
      } else {
        logger.info(`Call ${callId} is NOT a sale - skipping AI processing`);
      }

      // Log call upload
      await auditService.logCallUpload(req.user, call, req);

      res.status(201).json({
        success: true,
        message: 'Call uploaded successfully. Processing started.',
        data: call,
      });
    } catch (error) {
      // Clean up uploaded file if database operation fails
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) logger.error('Error deleting uploaded file', { 
            path: req.file.path, 
            error: err.message 
          });
        });
      }
      next(error);
    }
  },
];

/**
 * Process call asynchronously using FREE & open-source AI models
 */
async function processCallAsync(callId) {
  try {
    const call = await Call.findById(callId);
    if (!call) return;

    logger.info('Starting AI processing', { callId: call.callId });

    // Update status
    call.status = 'processing';
    await call.save();

    // IMPORTANT: Ensure RunPod GPU is running before processing
    try {
      if (runpodService.isConfigured()) {
        logger.info('Checking RunPod status before AI processing', { callId: call.callId });
        const podReady = await runpodService.ensurePodRunning();
        if (podReady) {
          logger.info('RunPod and AI service are ready for processing', { callId: call.callId });
        } else {
          logger.warn('RunPod not available, proceeding anyway', { callId: call.callId });
        }
      } else {
        logger.info('RunPod not configured, proceeding with AI service', { callId: call.callId });
      }
    } catch (podError) {
      logger.error('Failed to start RunPod or verify service health', { 
        callId: call.callId, 
        error: podError.message 
      });
      // Continue with processing even if pod start fails
      // The AI service might be running elsewhere
    }
    }

    // Step 1: Transcribe audio (FREE Whisper)
    logger.info('Transcribing audio with Whisper', { callId: call.callId });
    const transcriptionResult = await aiService.transcribeAudio(call.audioFilePath);
    call.transcript = transcriptionResult.text;
    call.transcriptTimestamps = transcriptionResult.timestamps || [];
    call.wordCount = transcriptionResult.word_count || call.transcript.split(' ').length;
    await call.save();

    // Step 2: Speaker Diarization (FREE pyannote.audio) - CRITICAL
    logger.info('Processing speaker diarization', { callId: call.callId });
    try {
      const diarizeResult = await aiService.diarizeAudio(call.audioFilePath);
      call.speakerSegments = diarizeResult.speaker_segments;
      call.speakers = diarizeResult.speakers;
      await call.save();

      // Step 2b: Calculate talk-time metrics
      logger.info('Calculating talk-time metrics', { callId: call.callId });
      const talkTimeResult = await aiService.calculateTalkTime(
        call.audioFilePath,
        diarizeResult.speaker_segments
      );
      
      call.agentTalkTime = talkTimeResult.speaker_talk_time.SPEAKER_00 || 0;
      call.customerTalkTime = talkTimeResult.speaker_talk_time.SPEAKER_01 || 0;
      call.talkTimeRatio = talkTimeResult.agent_customer_ratio || 'N/A';
      call.deadAirTotal = talkTimeResult.dead_air_total || 0;
      call.deadAirSegments = talkTimeResult.dead_air_segments || [];
      await call.save();
    } catch (error) {
      logger.warn('Diarization skipped', { callId: call.callId, error: error.message });
    }

    // Step 3: Analyze sentiment (FREE DistilBERT)
    logger.info('Analyzing sentiment', { callId: call.callId });
    const sentimentResult = await aiService.analyzeSentiment(call.transcript);
    call.sentiment = sentimentResult.label;
    call.sentimentScore = sentimentResult.score;
    
    // Set agent/customer sentiment (placeholder - proper implementation needs segment mapping)
    call.agentSentiment = sentimentResult.label;
    call.customerSentiment = sentimentResult.label;
    await call.save();

    // Step 4: Extract entities (FREE spaCy) - optional
    logger.info('Extracting entities', { callId: call.callId });
    try {
      const entitiesResult = await aiService.extractEntities(call.transcript);
      call.entities = entitiesResult.entities || [];
      call.keyPhrases = entitiesResult.key_phrases || [];
      await call.save();
    } catch (error) {
      logger.warn('Entity extraction skipped', { callId: call.callId, error: error.message });
    }

    // Step 5: Generate summary (FREE BART) - optional for longer transcripts
    try {
      if (call.transcript.length > 500) {
        logger.info('Generating summary', { callId: call.callId });
        const summaryResult = await aiService.summarizeText(call.transcript);
        call.summary = summaryResult.summary;
        await call.save();
      }
    } catch (error) {
      logger.warn('Summarization skipped', { callId: call.callId, error: error.message });
    }

    // Step 6: Check compliance (FREE rapidfuzz + regex)
    logger.info('Checking compliance', { callId: call.callId, campaign: call.campaign });
    const complianceResult = await scoringService.checkCompliance(
      call.transcript,
      call.campaign
    );
    call.complianceScore = complianceResult.score;
    call.missingMandatoryPhrases = complianceResult.missingMandatory;
    call.detectedForbiddenPhrases = complianceResult.detectedForbidden;
    await call.save();

    // Step 7: Calculate quality score (rule-based, agent-focused)
    logger.info('Calculating quality score', { callId: call.callId });
    const qualityResult = scoringService.calculateQualityScore({
      transcript: call.transcript,
      sentiment: call.agentSentiment || call.sentiment,
      complianceScore: call.complianceScore,
      duration: call.duration,
      talkTimeRatio: call.talkTimeRatio,
      deadAirTotal: call.deadAirTotal,
    });
    call.qualityScore = qualityResult.score;
    call.qualityMetrics = qualityResult.metrics;
    await call.save();

    // Mark as completed
    call.status = 'completed';
    call.processedAt = new Date();
    await call.save();

    logger.info('Call processed successfully', { callId: call.callId, qualityScore: call.qualityScore });
  } catch (error) {
    logger.error('Error processing call', { callId, error: error.message, stack: error.stack });
    
    // Update call with error status
    await Call.findByIdAndUpdate(callId, {
      status: 'failed',
      processingError: error.message,
    });
  }
}

/**
 * @route   GET /api/calls
 * @desc    Get all calls with filtering and pagination
 * @access  Private
 */
exports.getCalls = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      campaign,
      agentId,
      status,
      startDate,
      endDate,
      minQualityScore,
      maxQualityScore,
    } = req.query;

    // Build query
    const query = {};

    if (campaign) query.campaign = campaign;
    if (agentId) query.agentId = agentId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.callDate = {};
      if (startDate) query.callDate.$gte = new Date(startDate);
      if (endDate) query.callDate.$lte = new Date(endDate);
    }

    if (minQualityScore || maxQualityScore) {
      query.qualityScore = {};
      if (minQualityScore) query.qualityScore.$gte = parseFloat(minQualityScore);
      if (maxQualityScore) query.qualityScore.$lte = parseFloat(maxQualityScore);
    }

    // Role-based access control
    if (req.user.role === 'Agent') {
      query.agentId = req.user._id;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const calls = await Call.find(query)
      .sort({ callDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('agentId', 'name email')
      .populate('uploadedBy', 'name email');

    const total = await Call.countDocuments(query);

    res.status(200).json({
      success: true,
      count: calls.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: calls,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/calls/:id
 * @desc    Get single call by ID
 * @access  Private
 */
exports.getCallById = async (req, res, next) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('agentId', 'name email department')
      .populate('uploadedBy', 'name email')
      .populate('reviewedBy', 'name email');

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    // Role-based access control
    if (req.user.role === 'Agent' && call.agentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this call',
      });
    }

    res.status(200).json({
      success: true,
      data: call,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/calls/:id/audio
 * @desc    Stream call audio file
 * @access  Private
 */
exports.getCallAudio = async (req, res, next) => {
  try {
    const call = await Call.findById(req.params.id);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    // Role-based access control
    if (req.user.role === 'Agent' && call.agentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this audio',
      });
    }

    // Check if file exists
    if (!fs.existsSync(call.audioFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found',
      });
    }

    // Stream the audio file
    const stat = fs.statSync(call.audioFilePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(call.audioFilePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(call.audioFilePath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/calls/:id
 * @desc    Delete a call
 * @access  Private (Admin, Manager only)
 */
exports.deleteCall = async (req, res, next) => {
  try {
    const call = await Call.findById(req.params.id);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    // Log deletion before deleting
    await auditService.logCallDeletion(req.user, call, req);

    // Delete audio file
    if (fs.existsSync(call.audioFilePath)) {
      fs.unlinkSync(call.audioFilePath);
    }

    // Delete from database
    await call.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Call deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
