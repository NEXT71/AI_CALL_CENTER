const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Call = require('../models/Call');
const config = require('../config/config');
const aiService = require('../services/aiService');
const scoringService = require('../services/scoringService');
const auditService = require('../services/auditService');
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
  const allowedTypes = ['.wav', '.mp3', '.m4a', '.ogg'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files (.wav, .mp3, .m4a, .ogg) are allowed.'));
  }
};

// Magic number (file signature) validation for audio files
const validateAudioFile = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  
  // Check magic numbers for common audio formats
  const magicNumbers = {
    wav: [0x52, 0x49, 0x46, 0x46], // RIFF
    mp3: [0xFF, 0xFB], // MP3 frame sync
    mp3_id3: [0x49, 0x44, 0x33], // ID3
    m4a: [0x66, 0x74, 0x79, 0x70], // ftyp (at offset 4)
    ogg: [0x4F, 0x67, 0x67, 0x53], // OggS
  };
  
  // Check WAV
  if (buffer[0] === magicNumbers.wav[0] && buffer[1] === magicNumbers.wav[1] &&
      buffer[2] === magicNumbers.wav[2] && buffer[3] === magicNumbers.wav[3]) {
    return true;
  }
  
  // Check MP3
  if ((buffer[0] === magicNumbers.mp3[0] && buffer[1] === magicNumbers.mp3[1]) ||
      (buffer[0] === magicNumbers.mp3_id3[0] && buffer[1] === magicNumbers.mp3_id3[1])) {
    return true;
  }
  
  // Check M4A (ftyp at offset 4)
  if (buffer[4] === magicNumbers.m4a[0] && buffer[5] === magicNumbers.m4a[1] &&
      buffer[6] === magicNumbers.m4a[2] && buffer[7] === magicNumbers.m4a[3]) {
    return true;
  }
  
  // Check OGG
  if (buffer[0] === magicNumbers.ogg[0] && buffer[1] === magicNumbers.ogg[1] &&
      buffer[2] === magicNumbers.ogg[2] && buffer[3] === magicNumbers.ogg[3]) {
    return true;
  }
  
  return false;
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

      // Create call record
      const call = await Call.create({
        callId,
        agentId,
        agentName,
        customerId,
        customerName,
        campaign,
        duration: parseInt(duration),
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
          if (err) console.error('Error deleting file:', err);
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

    console.log(`🔄 Processing call ${call.callId} with FREE AI models...`);

    // Update status
    call.status = 'processing';
    await call.save();

    // Step 1: Transcribe audio (FREE Whisper)
    console.log(`🎙️  Step 1: Transcribing with Whisper (medium)...`);
    const transcriptionResult = await aiService.transcribeAudio(call.audioFilePath);
    call.transcript = transcriptionResult.text;
    call.transcriptTimestamps = transcriptionResult.timestamps || [];
    call.wordCount = transcriptionResult.word_count || call.transcript.split(' ').length;
    await call.save();

    // Step 2: Speaker Diarization (FREE pyannote.audio) - CRITICAL
    console.log(`🎭 Step 2: Speaker diarization with pyannote.audio...`);
    try {
      const diarizeResult = await aiService.diarizeAudio(call.audioFilePath);
      call.speakerSegments = diarizeResult.speaker_segments;
      call.speakers = diarizeResult.speakers;
      await call.save();

      // Step 2b: Calculate talk-time metrics
      console.log(`📊 Step 2b: Calculating talk-time metrics...`);
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
      console.log(`⚠️  Diarization skipped: ${error.message}`);
    }

    // Step 3: Analyze sentiment (FREE DistilBERT)
    console.log(`😊 Step 3: Analyzing sentiment with DistilBERT...`);
    const sentimentResult = await aiService.analyzeSentiment(call.transcript);
    call.sentiment = sentimentResult.label;
    call.sentimentScore = sentimentResult.score;
    
    // Set agent/customer sentiment (placeholder - proper implementation needs segment mapping)
    call.agentSentiment = sentimentResult.label;
    call.customerSentiment = sentimentResult.label;
    await call.save();

    // Step 4: Extract entities (FREE spaCy) - optional
    try {
      console.log(`🔍 Step 4: Extracting entities with spaCy...`);
      const entitiesResult = await aiService.extractEntities(call.transcript);
      call.entities = entitiesResult.entities || [];
      call.keyPhrases = entitiesResult.key_phrases || [];
      await call.save();
    } catch (error) {
      console.log(`⚠️  Entity extraction skipped: ${error.message}`);
    }

    // Step 5: Generate summary (FREE BART) - optional for longer transcripts
    try {
      if (call.transcript.length > 500) {
        console.log(`📄 Step 5: Generating summary with BART...`);
        const summaryResult = await aiService.summarizeText(call.transcript);
        call.summary = summaryResult.summary;
        await call.save();
      }
    } catch (error) {
      console.log(`⚠️  Summarization skipped: ${error.message}`);
    }

    // Step 6: Check compliance (FREE rapidfuzz + regex)
    console.log(`✅ Step 6: Checking compliance with rapidfuzz...`);
    const complianceResult = await scoringService.checkCompliance(
      call.transcript,
      call.campaign
    );
    call.complianceScore = complianceResult.score;
    call.missingMandatoryPhrases = complianceResult.missingMandatory;
    call.detectedForbiddenPhrases = complianceResult.detectedForbidden;
    await call.save();

    // Step 7: Calculate quality score (rule-based, agent-focused)
    console.log(`📊 Step 7: Calculating quality score...`);
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

    console.log(`✅ Call ${call.callId} processed successfully (100% FREE AI)`);
  } catch (error) {
    console.error(`❌ Error processing call ${callId}:`, error);
    
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
