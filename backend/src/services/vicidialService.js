// services/vicidialService.js
const mysql = require('mysql2/promise');
const VicidialMapper = require('../utils/vicidialMapping');
const Call = require('../models/Call');
const User = require('../models/User');
const logger = require('../config/logger');

class VicidialService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      this.connection = await mysql.createConnection({
        host: process.env.VICIDIAL_DB_HOST || 'localhost',
        user: process.env.VICIDIAL_DB_USER || 'vicidialuser',
        password: process.env.VICIDIAL_DB_PASS || '',
        database: process.env.VICIDIAL_DB_NAME || 'asterisk',
        port: process.env.VICIDIAL_DB_PORT || 3306,
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000,
      });

      this.isConnected = true;
      logger.info('Connected to Vicidial database');
    } catch (error) {
      logger.error('Failed to connect to Vicidial database:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.isConnected = false;
      logger.info('Disconnected from Vicidial database');
    }
  }

  /**
   * Sync call logs from Vicidial to your application
   * @param {Date} lastSyncTime - Only sync calls after this time
   * @returns {Object} Sync results
   */
  async syncCallLogs(lastSyncTime = null) {
    await this.connect();

    const syncTime = lastSyncTime || new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const query = `
      SELECT
        vl.uniqueid,
        vl.lead_id,
        vl.list_id,
        vl.campaign_id,
        vl.call_date,
        vl.start_epoch,
        vl.end_epoch,
        vl.length_in_sec,
        vl.status,
        vl.phone_number,
        vl.user,
        vl.comments,
        vl.term_reason,
        vlist.first_name,
        vlist.last_name,
        vlist.vendor_lead_code,
        vlist.status as lead_status,
        vrec.recording_id,
        vrec.filename,
        vrec.location,
        vrec.length_in_sec as recording_length
      FROM vicidial_log vl
      LEFT JOIN vicidial_list vlist ON vl.lead_id = vlist.lead_id
      LEFT JOIN vicidial_recordings vrec ON vl.lead_id = vrec.lead_id
      WHERE vl.call_date > ?
        AND vl.status NOT IN ('DROP', 'XDROP')  /* Exclude dropped calls */
      ORDER BY vl.call_date DESC
      LIMIT 1000  /* Process in batches */
    `;

    try {
      const [rows] = await this.connection.execute(query, [syncTime]);

      let processed = 0;
      let skipped = 0;
      let errors = 0;

      for (const vicidialCall of rows) {
        try {
          // Check if call already exists
          const existingCall = await Call.findOne({ callId: `VD_${vicidialCall.uniqueid}` });
          if (existingCall) {
            skipped++;
            continue;
          }

          // Map Vicidial data to your format
          const callData = VicidialMapper.mapCallLog(vicidialCall);

          // Find agent by Vicidial username
          const agent = await User.findOne({ name: callData.agentName });
          if (agent) {
            callData.agentId = agent._id;
            callData.uploadedBy = agent._id;
          } else {
            // Create agent if doesn't exist (optional)
            logger.warn(`Agent not found: ${callData.agentName}`);
          }

          // Create call record
          const call = new Call(callData);
          await call.save();

          processed++;

          // Trigger AI processing if recording exists and call was completed
          if (call.audioFilePath && call.status === 'completed') {
            // Queue for AI processing (you'd implement this)
            logger.info(`Queued call ${call.callId} for AI processing`);
          }

        } catch (error) {
          logger.error(`Error processing Vicidial call ${vicidialCall.uniqueid}:`, error);
          errors++;
        }
      }

      return {
        success: true,
        processed,
        skipped,
        errors,
        total: rows.length,
        lastSyncTime: new Date()
      };

    } catch (error) {
      logger.error('Error syncing Vicidial call logs:', error);
      throw error;
    }
  }

  /**
   * Get real-time agent status from Vicidial
   * @returns {Array} Agent status data
   */
  async getAgentStatus() {
    await this.connect();

    const query = `
      SELECT
        vu.user,
        vu.full_name,
        vu.user_level,
        vla.status,
        vla.campaign_id,
        vla.callerid,
        vla.lead_id,
        vla.uniqueid
      FROM vicidial_users vu
      LEFT JOIN vicidial_live_agents vla ON vu.user = vla.user
      WHERE vu.user_level > 0
      ORDER BY vu.full_name
    `;

    try {
      const [rows] = await this.connection.execute(query);
      return rows.map(agent => ({
        username: agent.user,
        fullName: agent.full_name,
        level: agent.user_level,
        status: agent.status || 'NOT_LOGGED_IN',
        campaign: agent.campaign_id,
        currentCallId: agent.callerid,
        leadId: agent.lead_id,
        uniqueId: agent.uniqueid
      }));
    } catch (error) {
      logger.error('Error getting agent status:', error);
      throw error;
    }
  }

  /**
   * Get campaign statistics from Vicidial
   * @param {string} campaignId - Specific campaign or empty for all
   * @returns {Array} Campaign stats
   */
  async getCampaignStats(campaignId = '') {
    await this.connect();

    let whereClause = '';
    let params = [];

    if (campaignId) {
      whereClause = 'WHERE vl.campaign_id = ?';
      params = [campaignId];
    }

    const query = `
      SELECT
        vl.campaign_id,
        COUNT(*) as total_calls,
        SUM(CASE WHEN vl.status = 'SALE' THEN 1 ELSE 0 END) as sales,
        SUM(CASE WHEN vl.status IN ('NI', 'B', 'AA') THEN 1 ELSE 0 END) as no_answers,
        AVG(vl.length_in_sec) as avg_call_length,
        COUNT(DISTINCT vl.user) as active_agents
      FROM vicidial_log vl
      WHERE vl.call_date >= CURDATE()
      ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
      GROUP BY vl.campaign_id
      ORDER BY total_calls DESC
    `;

    try {
      const [rows] = await this.connection.execute(query, params);
      return rows;
    } catch (error) {
      logger.error('Error getting campaign stats:', error);
      throw error;
    }
  }

  /**
   * Test connection to Vicidial database
   * @returns {boolean} Connection status
   */
  async testConnection() {
    try {
      await this.connect();
      await this.connection.execute('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Vicidial connection test failed:', error);
      return false;
    }
  }
}

module.exports = VicidialService;