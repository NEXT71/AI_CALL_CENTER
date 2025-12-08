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
    duration: {
      type: Number, // seconds
      required: true,
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
      hasGreeting: { type: Boolean, default: false },
      hasProperClosing: { type: Boolean, default: false },
      complianceLinesSpoken: { type: Boolean, default: false },
      agentInterruptionCount: { type: Number, default: 0 },
      avgSpeechRate: { type: Number },
    },
    // Processing Status
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
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
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
callSchema.index({ callId: 1 });
callSchema.index({ agentId: 1 });
callSchema.index({ campaign: 1 });
callSchema.index({ status: 1 });
callSchema.index({ callDate: -1 });

module.exports = mongoose.model('Call', callSchema);
