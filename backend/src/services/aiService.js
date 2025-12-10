const axios = require('axios');
const config = require('../config/config');
const logger = require('../config/logger');

const AI_SERVICE_URL = config.aiService.url;

/**
 * Transcribe audio file using FREE Whisper model (local)
 */
exports.transcribeAudio = async (audioFilePath) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/transcribe`,
      { audio_path: audioFilePath },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300000, // 5 minutes timeout for large files
      }
    );

    return response.data;
  } catch (error) {
    logger.error('AI Service transcription error', { error: error.message });
    throw new Error(`Transcription failed: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Analyze sentiment using FREE DistilBERT model
 */
exports.analyzeSentiment = async (text) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/analyze-sentiment`,
      { text },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000, // 1 minute timeout
      }
    );

    return response.data;
  } catch (error) {
    logger.error('AI Service sentiment analysis error', { error: error.message });
    throw new Error(`Sentiment analysis failed: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Extract entities using FREE spaCy model
 */
exports.extractEntities = async (text) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/extract-entities`,
      { text },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    return response.data;
  } catch (error) {
    logger.error('AI Service entity extraction error', { error: error.message });
    throw new Error(`Entity extraction failed: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Summarize text using FREE BART model
 */
exports.summarizeText = async (text, maxLength = 130, minLength = 30) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/summarize`,
      { text, max_length: maxLength, min_length: minLength },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000, // 2 minutes
      }
    );

    return response.data;
  } catch (error) {
    logger.error('AI Service summarization error', { error: error.message });
    throw new Error(`Summarization failed: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Check compliance using FREE rapidfuzz + regex
 */
exports.checkCompliance = async (transcript, mandatoryPhrases, forbiddenPhrases, fuzzyThreshold = 80) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/check-compliance`,
      {
        transcript,
        mandatory_phrases: mandatoryPhrases,
        forbidden_phrases: forbiddenPhrases,
        fuzzy_threshold: fuzzyThreshold,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error) {
    logger.error('AI Service compliance check error', { error: error.message });
    throw new Error(`Compliance check failed: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Speaker diarization using FREE pyannote.audio
 */
exports.diarizeAudio = async (audioFilePath, minSpeakers = 2, maxSpeakers = 2) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/diarize`,
      { 
        audio_path: audioFilePath,
        min_speakers: minSpeakers,
        max_speakers: maxSpeakers
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 180000, // 3 minutes
      }
    );

    return response.data;
  } catch (error) {
    logger.error('AI Service diarization error', { error: error.message });
    throw new Error(`Diarization failed: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Calculate talk-time metrics
 */
exports.calculateTalkTime = async (audioFilePath, speakerSegments) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/calculate-talk-time`,
      { 
        audio_path: audioFilePath,
        speaker_segments: speakerSegments
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    return response.data;
  } catch (error) {
    logger.error('AI Service talk-time calculation error', { error: error.message });
    throw new Error(`Talk-time calculation failed: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Health check for AI service
 */
exports.healthCheck = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    console.error('AI Service health check failed:', error.message);
    return { status: 'unavailable' };
  }
};
