const mongoose = require('mongoose');
const logger = require('../config/logger');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

/**
 * Clean up old processed call audio files to save disk space
 * - Runs every 6 hours to check disk usage
 * - Deletes oldest 5GB of files when storage reaches 7GB
 * - Also runs time-based cleanup for files older than retention period
 */
class FileCleanupJob {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads/calls';
    this.retentionDays = parseInt(process.env.FILE_RETENTION_DAYS) || 30;
    this.maxDiskUsageGB = 7; // Maximum disk usage before cleanup (7GB)
    this.cleanupAmountGB = 5; // Amount to delete when limit is reached (5GB)
  }

  /**
   * Start the scheduled cleanup jobs
   */
  start() {
    // Check disk usage every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await this.checkDiskUsageAndCleanup();
    });

    // Run time-based cleanup daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldFiles();
    });

    logger.info('File cleanup jobs scheduled', {
      diskCheckInterval: 'Every 6 hours',
      timeBasedCleanup: 'Daily at 2 AM',
      retentionDays: this.retentionDays,
      maxDiskUsageGB: this.maxDiskUsageGB,
      cleanupAmountGB: this.cleanupAmountGB,
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
        audioFilePath: { $exists: true, $ne: '' },
      }).select('_id audioFilePath callId');

      let deletedCount = 0;
      let errorCount = 0;

      for (const call of oldCalls) {
        try {
          // Check if file exists
          await fs.access(call.audioFilePath);

          // Delete the file
          await fs.unlink(call.audioFilePath);
          
          // Update call record to mark file as deleted
          call.audioFilePath = `[DELETED] ${call.audioFilePath}`;
          await call.save();

          deletedCount++;
          logger.debug(`Deleted file for call ${call.callId}`, { 
            path: call.audioFilePath 
          });
        } catch (err) {
          if (err.code !== 'ENOENT') {
            // Ignore if file doesn't exist
            errorCount++;
            logger.warn(`Failed to delete file for call ${call.callId}`, {
              error: err.message,
              path: call.audioFilePath,
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
   * Calculate total size of directory in bytes
   */
  async calculateDirectorySize(dirPath) {
    try {
      let totalSize = 0;
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
          } else if (stats.isDirectory()) {
            totalSize += await this.calculateDirectorySize(filePath);
          }
        } catch (err) {
          // Skip files that can't be accessed
          logger.warn(`Could not stat file: ${filePath}`, { error: err.message });
        }
      }

      return totalSize;
    } catch (error) {
      logger.error('Error calculating directory size', { error: error.message });
      return 0;
    }
  }

  /**
   * Check disk usage and cleanup if needed (delete oldest 5GB when 7GB reached)
   */
  async checkDiskUsageAndCleanup() {
    try {
      logger.info('Checking disk usage for audio files');

      // Calculate current directory size
      const totalSizeBytes = await this.calculateDirectorySize(this.uploadDir);
      const totalSizeGB = totalSizeBytes / (1024 ** 3);

      logger.info('Current disk usage', {
        sizeBytes: totalSizeBytes,
        sizeGB: totalSizeGB.toFixed(2),
        maxGB: this.maxDiskUsageGB,
      });

      // Check if cleanup is needed
      if (totalSizeGB >= this.maxDiskUsageGB) {
        logger.warn('Disk usage threshold reached, starting cleanup', {
          currentGB: totalSizeGB.toFixed(2),
          targetCleanupGB: this.cleanupAmountGB,
        });

        await this.cleanupBySize(this.cleanupAmountGB * (1024 ** 3));
      } else {
        logger.info('Disk usage within limits, no cleanup needed', {
          currentGB: totalSizeGB.toFixed(2),
          availableGB: (this.maxDiskUsageGB - totalSizeGB).toFixed(2),
        });
      }
    } catch (error) {
      logger.error('Disk usage check failed', { error: error.message });
    }
  }

  /**
   * Cleanup files by size - delete oldest files until targetBytes is freed
   */
  async cleanupBySize(targetBytes) {
    try {
      const Call = mongoose.model('Call');

      // Find all completed calls with audio files, sorted by oldest first
      const calls = await Call.find({
        status: 'completed',
        audioFilePath: { $exists: true, $ne: '' },
      })
        .select('_id audioFilePath callId callDate createdAt fileSize')
        .sort({ callDate: 1, createdAt: 1 }); // Oldest first

      let deletedSize = 0;
      let deletedCount = 0;
      let errorCount = 0;

      logger.info('Starting size-based cleanup', {
        targetBytes,
        targetGB: (targetBytes / (1024 ** 3)).toFixed(2),
        totalCalls: calls.length,
      });

      for (const call of calls) {
        if (deletedSize >= targetBytes) {
          break; // Reached target cleanup size
        }

        try {
          // Check if file exists and get its size
          const stats = await fs.stat(call.audioFilePath);
          const fileSize = stats.size;

          // Delete the file
          await fs.unlink(call.audioFilePath);

          // Update call record to mark file as deleted
          call.audioFilePath = `[DELETED-DISK-LIMIT] ${call.audioFilePath}`;
          call.fileDeleted = true;
          call.deletedAt = new Date();
          await call.save();

          deletedSize += fileSize;
          deletedCount++;

          logger.debug(`Deleted file for call ${call.callId}`, {
            path: call.audioFilePath,
            size: fileSize,
            sizeGB: (fileSize / (1024 ** 3)).toFixed(4),
            totalDeletedGB: (deletedSize / (1024 ** 3)).toFixed(2),
          });
        } catch (err) {
          if (err.code !== 'ENOENT') {
            // Ignore if file doesn't exist
            errorCount++;
            logger.warn(`Failed to delete file for call ${call.callId}`, {
              error: err.message,
              path: call.audioFilePath,
            });
          }
        }
      }

      logger.info('Size-based cleanup completed', {
        deletedFiles: deletedCount,
        deletedBytes: deletedSize,
        deletedGB: (deletedSize / (1024 ** 3)).toFixed(2),
        targetGB: (targetBytes / (1024 ** 3)).toFixed(2),
        errors: errorCount,
      });
    } catch (error) {
      logger.error('Size-based cleanup failed', { error: error.message });
    }
  }

  /**
   * Run cleanup manually (for testing)
   */
  async runNow() {
    await this.cleanupOldFiles();
  }

  /**
   * Run disk usage check manually (for testing)
   */
  async checkDiskNow() {
    await this.checkDiskUsageAndCleanup();
  }
}

module.exports = new FileCleanupJob();
