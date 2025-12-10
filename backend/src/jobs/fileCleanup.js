const mongoose = require('mongoose');
const logger = require('../config/logger');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

/**
 * Clean up old processed call audio files to save disk space
 * Runs daily at 2 AM
 */
class FileCleanupJob {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads/calls';
    this.retentionDays = parseInt(process.env.FILE_RETENTION_DAYS) || 30;
  }

  /**
   * Start the scheduled cleanup job
   */
  start() {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldFiles();
    });

    logger.info('File cleanup job scheduled (daily at 2 AM)', {
      retentionDays: this.retentionDays,
    });
  }

  /**
   * Clean up files older than retention period
   */
  async cleanupOldFiles() {
    try {
      logger.info('Starting file cleanup job');

      const Call = mongoose.model('Call');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      // Find processed calls older than retention period
      const oldCalls = await Call.find({
        status: 'completed',
        processedAt: { $lt: cutoffDate },
        audioPath: { $exists: true, $ne: '' },
      }).select('_id audioPath callId');

      let deletedCount = 0;
      let errorCount = 0;

      for (const call of oldCalls) {
        try {
          // Check if file exists
          await fs.access(call.audioPath);

          // Delete the file
          await fs.unlink(call.audioPath);
          
          // Update call record to mark file as deleted
          call.audioPath = `[DELETED] ${call.audioPath}`;
          await call.save();

          deletedCount++;
          logger.debug(`Deleted file for call ${call.callId}`, { 
            path: call.audioPath 
          });
        } catch (err) {
          if (err.code !== 'ENOENT') {
            // Ignore if file doesn't exist
            errorCount++;
            logger.warn(`Failed to delete file for call ${call.callId}`, {
              error: err.message,
              path: call.audioPath,
            });
          }
        }
      }

      logger.info('File cleanup job completed', {
        scanned: oldCalls.length,
        deleted: deletedCount,
        errors: errorCount,
        retentionDays: this.retentionDays,
      });
    } catch (error) {
      logger.error('File cleanup job failed', { error: error.message });
    }
  }

  /**
   * Run cleanup manually (for testing)
   */
  async runNow() {
    await this.cleanupOldFiles();
  }
}

module.exports = new FileCleanupJob();
