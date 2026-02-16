const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agentName: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    campaign: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
      required: true,
    },
    duration: {
      type: Number, // seconds
      required: false,
      default: 0,
    },
    callDate: {
      type: Date,
      required: true,
    },
    audioFilePath: {
      type: String,
      required: true,
    },
    audioFileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    // Transcription
    transcript: {
      type: String,
      default: '',
    },
    speakerLabeledTranscript: {
      type: String,
      default: '',
    },
    transcriptTimestamps: {
      type: Array,
      default: [],
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    // Analysis Results
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral', ''],
      default: '',
    },
    sentimentScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    // Entity Extraction (FREE spaCy)
    entities: {
      type: Array,
      default: [],
    },
    keyPhrases: {
      type: Array,
      default: [],
    },
    // Summarization (FREE BART)
    summary: {
      type: String,
      default: '',
    },
    // Speaker Diarization (FREE pyannote.audio)
    speakerSegments: {
      type: Array,
      default: [],
    },
    speakers: {
      type: Array,
      default: [],
    },
    agentTalkTime: {
      type: Number,
      default: 0,
    },
    customerTalkTime: {
      type: Number,
      default: 0,
    },
    talkTimeRatio: {
      type: String,
      default: '',
    },
    deadAirTotal: {
      type: Number,
      default: 0,
    },
    deadAirSegments: {
      type: Array,
      default: [],
    },
    // Per-speaker sentiment
    agentSentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral', ''],
      default: '',
    },
    customerSentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral', ''],
      default: '',
    },
    // Compliance
    complianceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    missingMandatoryPhrases: {
      type: [String],
      default: [],
    },
    detectedForbiddenPhrases: {
      type: [String],
      default: [],
    },
    // Quality
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    qualityMetrics: {
      // Traditional metrics (kept for backward compatibility)
      hasGreeting: { type: Boolean, default: false },
      hasProperClosing: { type: Boolean, default: false },
      complianceLinesSpoken: { type: Boolean, default: false },
      agentInterruptionCount: { type: Number, default: 0 },
      avgSpeechRate: { type: Number },
      
      // AI-based quality factors (6 factors from AI analysis)
      aiFactors: {
        customer_tone_score: Number,
        language_score: Number,
        agent_professionalism_score: Number,
        customer_communication_score: Number,
        abusive_language_penalty: Number,
        dnc_penalty: Number,
      },
      aiDetails: {
        customer_tone: String,
        detected_language: String,
        agent_casual_phrases: [String],
        customer_style: String,
        abusive_words_found: [String],
        dnc_phrases_found: [String],
      },
      aiFlags: {
        has_abusive_language: Boolean,
        is_dnc_customer: Boolean,
        agent_too_casual: Boolean,
        customer_frustrated: Boolean,
      },
    },
    // Sale Status - ONLY process calls that resulted in a sale
    isSale: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    saleAmount: {
      type: Number,
      min: 0,
    },
    productSold: {
      type: String,
      trim: true,
    },
    saleDate: {
      type: Date,
    },
    requiresQA: {
      type: Boolean,
      default: function() {
        return this.isSale === true; // Only QA if it's a sale
      },
      index: true,
    },
    // Processing Status
    status: {
      type: String,
      enum: ['uploaded', 'queued', 'processing', 'completed', 'failed', 'skipped'],
      default: 'uploaded',
    },
    processingError: {
      type: String,
    },
    processedAt: {
      type: Date,
    },
    // Metadata
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
    // File cleanup tracking
    fileDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Note: callId already has unique: true, so no separate index needed
callSchema.index({ agentId: 1 });
callSchema.index({ agentName: 1 });
callSchema.index({ campaign: 1 });
callSchema.index({ status: 1 });
callSchema.index({ callDate: -1 });
callSchema.index({ createdAt: -1 });
callSchema.index({ qualityScore: -1 });
callSchema.index({ complianceScore: -1 });
// Compound indexes for common queries
callSchema.index({ campaign: 1, callDate: -1 });
callSchema.index({ agentId: 1, callDate: -1 });
callSchema.index({ status: 1, createdAt: -1 });
callSchema.index({ isSale: 1, requiresQA: 1 });
callSchema.index({ isSale: 1, callDate: -1 });

module.exports = mongoose.model('Call', callSchema);
