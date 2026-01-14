const axios = require('axios');
const logger = require('../config/logger');
const config = require('../config/config');

const AI_SERVICE_URL = config.aiService.url;

/**
 * Transcribe audio file using FREE Whisper model (local)
 */
exports.transcribeAudio = async (audioFilePath) => {
  try {
    const fs = require('fs');
    const FormData = require('form-data');
    
    // Create form data with the audio file
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioFilePath), {
      filename: require('path').basename(audioFilePath),
      contentType: 'audio/mpeg', // Adjust based on file type
    });

    const response = await axios.post(
      `${AI_SERVICE_URL}/transcribe`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 3600000, // 60 minutes timeout for very long files
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        // Add retry logic
        validateStatus: function (status) {
          return status < 500; // Resolve only if status < 500
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Transcription failed with status ${response.status}`);
    }

    return response.data;
  } catch (error) {
    logger.error('AI Service transcription error', { error: error.message });
    
    // Check for specific error types
    if (error.code === 'ECONNABORTED') {
      throw new Error('Transcription timeout - audio file may be too long');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('AI service unavailable - please check if the service is running');
    }
    
    throw new Error(`Transcription failed: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Analyze sentiment using FREE DistilBERT model
 */
exports.analyzeSentiment = async (text) => {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const response = await axios.post(
      `${AI_SERVICE_URL}/analyze-sentiment`,
      { text },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000, // 2 minutes timeout (increased for long texts)
        validateStatus: function (status) {
          return status < 500;
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Sentiment analysis failed with status ${response.status}`);
    }

    return response.data;
  } catch (error) {
    logger.error('AI Service sentiment analysis error', { error: error.message });
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Sentiment analysis timeout - text may be too long');
    }
    
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
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const response = await axios.post(
      `${AI_SERVICE_URL}/summarize`,
      { text, max_length: maxLength, min_length: minLength },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300000, // 5 minutes (increased for very long texts)
        validateStatus: function (status) {
          return status < 500;
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Summarization failed with status ${response.status}`);
    }

    return response.data;
  } catch (error) {
    logger.error('AI Service summarization error', { error: error.message });
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Summarization timeout - text may be too long');
    }
    
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
    const fs = require('fs');
    const FormData = require('form-data');
    
    // Create form data with the audio file
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioFilePath), {
      filename: require('path').basename(audioFilePath),
      contentType: 'audio/mpeg',
    });
    formData.append('min_speakers', minSpeakers.toString());
    formData.append('max_speakers', maxSpeakers.toString());

    const response = await axios.post(
      `${AI_SERVICE_URL}/diarize`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 600000, // 10 minutes (increased for long audio)
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: function (status) {
          return status < 500;
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Diarization failed with status ${response.status}`);
    }

    return response.data;
  } catch (error) {
    logger.error('AI Service diarization error', { error: error.message });
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Diarization timeout - audio file may be too long');
    }
    
    throw new Error(`Diarization failed: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Calculate talk-time metrics
 */
exports.calculateTalkTime = async (audioFilePath, speakerSegments) => {
  try {
    const fs = require('fs');
    const FormData = require('form-data');
    
    if (!speakerSegments || !Array.isArray(speakerSegments)) {
      throw new Error('Invalid speaker segments');
    }
    
    // Create form data with the audio file
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioFilePath), {
      filename: require('path').basename(audioFilePath),
      contentType: 'audio/mpeg',
    });
    formData.append('speaker_segments', JSON.stringify(speakerSegments));

    const response = await axios.post(
      `${AI_SERVICE_URL}/calculate-talk-time`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 120000, // 2 minutes (increased)
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: function (status) {
          return status < 500;
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Talk-time calculation failed with status ${response.status}`);
    }

    return response.data;
  } catch (error) {
    logger.error('AI Service talk-time calculation error', { error: error.message });
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Talk-time calculation timeout');
    }
    
    throw new Error(`Talk-time calculation failed: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Transcribe audio with speaker labels (Agent/Customer)
 * Combined endpoint that does transcription + diarization in one call
 */
exports.transcribeWithSpeakers = async (audioFilePath, minSpeakers = 2, maxSpeakers = 2) => {
  try {
    const fs = require('fs');
    const FormData = require('form-data');
    
    // Create form data with the audio file
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioFilePath), {
      filename: require('path').basename(audioFilePath),
      contentType: 'audio/mpeg',
    });
    formData.append('min_speakers', minSpeakers.toString());
    formData.append('max_speakers', maxSpeakers.toString());

    const response = await axios.post(
      `${AI_SERVICE_URL}/transcribe-with-speakers`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 3600000, // 60 minutes timeout for very long files
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: function (status) {
          return status < 500;
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Transcription with speakers failed with status ${response.status}`);
    }

    return response.data;
  } catch (error) {
    logger.error('AI Service transcribe-with-speakers error', { error: error.message });
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Transcription with speakers timeout - audio file may be too long');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('AI service unavailable - please check if the service is running');
    }
    
    throw new Error(`Transcription with speakers failed: ${error.response?.data?.detail || error.message}`);
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
    logger.error('AI Service health check failed', { error: error.message });
    return { status: 'unavailable' };
  }
};
