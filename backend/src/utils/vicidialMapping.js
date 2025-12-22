# Vicidial Data Mapping Guide
# How Vicidial fields map to your AI Call Center application

## Overview
This document shows how Vicidial dialer data would integrate with your current MongoDB-based call center application, even without direct Vicidial access. The mapping is based on Vicidial's standard database schema and API responses.

## Vicidial Database Tables Reference

### vicidial_list (Lead/Contact Data)
- lead_id: Unique identifier for each contact
- list_id: Campaign/list identifier
- phone_number: Customer phone number
- first_name, last_name: Customer name
- vendor_lead_code: External reference ID
- status: Contact status (NEW, CALLBK, etc.)
- called_since_last_reset: Call attempt tracking

### vicidial_log (Call Activity Log)
- uniqueid: Asterisk unique call identifier
- lead_id: Reference to vicidial_list
- list_id: Campaign identifier
- campaign_id: Campaign name
- call_date: When call was made
- start_epoch: Unix timestamp start
- end_epoch: Unix timestamp end
- length_in_sec: Call duration
- status: Call disposition (SALE, DNC, etc.)
- phone_number: Number dialed
- user: Agent who handled the call
- comments: Agent notes
- term_reason: How call ended

### vicidial_recordings (Call Recordings)
- recording_id: Unique recording identifier
- lead_id: Associated lead
- filename: Recording file path
- location: Full file path
- start_time: Recording start
- end_time: Recording end
- length_in_sec: Recording duration

### vicidial_users (Agent Data)
- user: Agent login username
- full_name: Agent display name
- user_level: Permission level
- user_group: Team/group assignment

## Field Mapping: Vicidial → Your Application

### Direct Field Mappings

| Vicidial Field | Vicidial Table | Your App Field | Your Model | Notes |
|---------------|----------------|----------------|------------|-------|
| uniqueid | vicidial_log | callId | Call.callId | Primary key, format: `VD_{uniqueid}` |
| lead_id | vicidial_log | externalCallId | Call.externalCallId | Vicidial reference ID |
| phone_number | vicidial_log | customerPhone | Call.customerPhone | Customer's phone number |
| first_name + last_name | vicidial_list | customerName | Call.customerName | Combined name fields |
| vendor_lead_code | vicidial_list | customerId | Call.customerId | External customer ID |
| user | vicidial_log | agentName | Call.agentName | Agent who handled call |
| campaign_id | vicidial_log | campaign | Call.campaign | ACA, Medicare, Final Expense |
| call_date | vicidial_log | callDate | Call.callDate | Call timestamp |
| length_in_sec | vicidial_log | duration | Call.duration | Call length in seconds |
| status | vicidial_log | disposition | Call.disposition | SALE, DNC, etc. |
| recording_id | vicidial_recordings | audioFilePath | Call.audioFilePath | Recording file reference |
| filename | vicidial_recordings | audioFileName | Call.audioFileName | Recording filename |
| comments | vicidial_log | notes | Call.notes | Agent notes |

### Derived/Transformed Mappings

| Vicidial Data | Your App Field | Transformation Logic |
|---------------|----------------|---------------------|
| end_epoch - start_epoch | duration | Calculate duration if not provided |
| campaign_id | campaign | Map Vicidial campaigns to your campaigns |
| status | status | Map dispositions to processing status |
| recording location | audioFilePath | Full path to recording file |
| user | agentId | Lookup agent by name in User collection |

### Status/Disposition Mapping

| Vicidial Status | Your App Status | Your App Disposition |
|----------------|-----------------|---------------------|
| SALE | completed | SALE |
| DNC | completed | DNC |
| NI | completed | NO_ANSWER |
| B | completed | BUSY |
| AA | completed | ANSWERING_MACHINE |
| DEC | completed | DECLINE |
| A | completed | ANSWER |
| DC | completed | DISCONNECT |
| NA | failed | NETWORK_ERROR |

### Campaign Mapping Examples

| Vicidial Campaign | Your App Campaign |
|-------------------|-------------------|
| ACA_Outbound | ACA |
| Medicare_Sales | Medicare |
| Final_Expense | Final Expense |
| ACA_Inbound | ACA |
| Medicare_Inbound | Medicare |

## Data Flow Scenarios

### Scenario 1: Outbound Sale Call
```
Vicidial Data:
- uniqueid: 1734987654.12345
- lead_id: 123456
- campaign_id: ACA_Outbound
- user: john_doe
- status: SALE
- length_in_sec: 420
- recording_id: REC_001234

Your App Call Record:
{
  callId: "VD_1734987654.12345",
  externalCallId: "123456",
  campaign: "ACA",
  agentName: "john_doe",
  disposition: "SALE",
  duration: 420,
  status: "completed",
  audioFilePath: "REC_001234",
  isSale: true,
  requiresQA: true
}
```

### Scenario 2: Inbound Medicare Call
```
Vicidial Data:
- uniqueid: 1734987800.67890
- lead_id: 123457
- campaign_id: Medicare_Inbound
- user: jane_smith
- status: DEC
- length_in_sec: 180
- recording_id: REC_001235

Your App Call Record:
{
  callId: "VD_1734987800.67890",
  externalCallId: "123457",
  campaign: "Medicare",
  agentName: "jane_smith",
  disposition: "DEC",
  duration: 180,
  status: "completed",
  audioFilePath: "REC_001235",
  isSale: false,
  requiresQA: false
}
```

## Integration Implementation Code

### 1. Data Mapping Utility
```javascript
// utils/vicidialMapper.js
class VicidialMapper {
  static mapCallLog(vicidialCall) {
    return {
      callId: `VD_${vicidialCall.uniqueid}`,
      externalCallId: vicidialCall.lead_id,
      customerPhone: vicidialCall.phone_number,
      customerName: this.combineNames(vicidialCall.first_name, vicidialCall.last_name),
      customerId: vicidialCall.vendor_lead_code,
      agentName: vicidialCall.user,
      campaign: this.mapCampaign(vicidialCall.campaign_id),
      callDate: new Date(vicidialCall.call_date),
      duration: parseInt(vicidialCall.length_in_sec),
      disposition: vicidialCall.status,
      status: this.mapStatus(vicidialCall.status),
      audioFilePath: vicidialCall.recording_id,
      audioFileName: vicidialCall.filename,
      notes: vicidialCall.comments,
      isSale: vicidialCall.status === 'SALE',
      requiresQA: vicidialCall.status === 'SALE'
    };
  }

  static mapCampaign(vicidialCampaign) {
    const campaignMap = {
      'ACA_Outbound': 'ACA',
      'ACA_Inbound': 'ACA',
      'Medicare_Sales': 'Medicare',
      'Medicare_Inbound': 'Medicare',
      'Final_Expense': 'Final Expense'
    };
    return campaignMap[vicidialCampaign] || vicidialCampaign;
  }

  static mapStatus(vicidialStatus) {
    const statusMap = {
      'SALE': 'completed',
      'DNC': 'completed',
      'NI': 'completed',
      'B': 'completed',
      'AA': 'completed',
      'DEC': 'completed',
      'A': 'completed',
      'DC': 'completed',
      'NA': 'failed'
    };
    return statusMap[vicidialStatus] || 'completed';
  }

  static combineNames(firstName, lastName) {
    const parts = [firstName, lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '';
  }
}

module.exports = VicidialMapper;
```

### 2. Synchronization Service
```javascript
// services/vicidialSyncService.js
const VicidialMapper = require('../utils/vicidialMapper');
const Call = require('../models/Call');
const User = require('../models/User');

class VicidialSyncService {
  constructor(vicidialDbConnection) {
    this.vicidialDb = vicidialDbConnection;
  }

  async syncCallLogs(lastSyncTime = null) {
    const syncTime = lastSyncTime || new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const query = `
      SELECT
        vl.uniqueid,
        vl.lead_id,
        vl.list_id,
        vl.campaign_id,
        vl.call_date,
        vl.length_in_sec,
        vl.status,
        vl.phone_number,
        vl.user,
        vl.comments,
        vl.term_reason,
        vlist.first_name,
        vlist.last_name,
        vlist.vendor_lead_code,
        vrec.recording_id,
        vrec.filename,
        vrec.location
      FROM vicidial_log vl
      LEFT JOIN vicidial_list vlist ON vl.lead_id = vlist.lead_id
      LEFT JOIN vicidial_recordings vrec ON vl.lead_id = vrec.lead_id
      WHERE vl.call_date > ?
      ORDER BY vl.call_date DESC
    `;

    try {
      const [rows] = await this.vicidialDb.execute(query, [syncTime]);
      const syncedCalls = [];

      for (const vicidialCall of rows) {
        try {
          const callData = VicidialMapper.mapCallLog(vicidialCall);

          // Find agent by name
          const agent = await User.findOne({ name: callData.agentName });
          if (agent) {
            callData.agentId = agent._id;
            callData.uploadedBy = agent._id; // Assume agent uploaded
          }

          // Upsert call record
          const call = await Call.findOneAndUpdate(
            { callId: callData.callId },
            callData,
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );

          syncedCalls.push(call);
        } catch (error) {
          console.error(`Error syncing call ${vicidialCall.uniqueid}:`, error);
        }
      }

      return {
        synced: syncedCalls.length,
        total: rows.length,
        lastSyncTime: new Date()
      };
    } catch (error) {
      console.error('Error in syncCallLogs:', error);
      throw error;
    }
  }
}

module.exports = VicidialSyncService;
```

### 3. Webhook Handler for Real-time Updates
```javascript
// controllers/vicidialWebhookController.js
const VicidialMapper = require('../utils/vicidialMapper');
const Call = require('../models/Call');
const aiService = require('../services/aiService');

exports.handleCallCompletion = async (req, res) => {
  try {
    const vicidialData = req.body;

    // Map Vicidial data to your format
    const callData = VicidialMapper.mapCallLog(vicidialData);

    // Find agent
    const User = require('../models/User');
    const agent = await User.findOne({ name: callData.agentName });
    if (agent) {
      callData.agentId = agent._id;
      callData.uploadedBy = agent._id;
    }

    // Create/update call record
    const call = await Call.findOneAndUpdate(
      { callId: callData.callId },
      callData,
      { upsert: true, new: true }
    );

    // Trigger AI processing if recording exists
    if (call.audioFilePath && call.status === 'completed') {
      // Queue for AI processing
      await aiService.processCall(call.callId);
    }

    res.status(200).json({
      success: true,
      callId: call.callId,
      message: 'Call data processed successfully'
    });

  } catch (error) {
    console.error('Error processing Vicidial webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process call data'
    });
  }
};
```

### 4. API Integration for Bidirectional Sync
```javascript
// services/vicidialApiService.js
const axios = require('axios');

class VicidialApiService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.VICIDIAL_API_URL,
      timeout: 30000
    });

    this.defaultParams = {
      user: process.env.VICIDIAL_API_USER,
      pass: process.env.VICIDIAL_API_PASS
    };
  }

  async addLead(leadData) {
    const params = {
      ...this.defaultParams,
      function: 'add_lead',
      source: 'ai_call_center',
      ...leadData
    };

    const response = await this.client.get('/non_agent_api.php', { params });
    return this.parseApiResponse(response.data);
  }

  async getCallLogs(campaign = '', startDate = '', endDate = '') {
    const params = {
      ...this.defaultParams,
      function: 'call_log',
      campaign: campaign,
      start_date: startDate,
      end_date: endDate
    };

    const response = await this.client.get('/non_agent_api.php', { params });
    return this.parseApiResponse(response.data);
  }

  async getAgentStatus() {
    const params = {
      ...this.defaultParams,
      function: 'logged_in_agents'
    };

    const response = await this.client.get('/non_agent_api.php', { params });
    return this.parseApiResponse(response.data);
  }

  parseApiResponse(data) {
    // Parse Vicidial's pipe-delimited response format
    if (typeof data === 'string') {
      const lines = data.split('\n');
      const headers = lines[0].split('|');
      const rows = lines.slice(1).map(line => {
        const values = line.split('|');
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        return obj;
      });
      return rows;
    }
    return data;
  }
}

module.exports = VicidialApiService;
```

## Testing Without Vicidial Access

### Mock Data for Testing
```javascript
// test/mockVicidialData.js
const mockVicidialCalls = [
  {
    uniqueid: '1734987654.12345',
    lead_id: '123456',
    campaign_id: 'ACA_Outbound',
    call_date: '2024-12-23 10:30:00',
    length_in_sec: '420',
    status: 'SALE',
    phone_number: '555-0101',
    user: 'john_doe',
    comments: 'Sold ACA policy',
    first_name: 'John',
    last_name: 'Smith',
    vendor_lead_code: 'EXT_001',
    recording_id: 'REC_001234',
    filename: '20241223-103000_123456.wav'
  },
  {
    uniqueid: '1734987800.67890',
    lead_id: '123457',
    campaign_id: 'Medicare_Inbound',
    call_date: '2024-12-23 10:35:00',
    length_in_sec: '180',
    status: 'DEC',
    phone_number: '555-0102',
    user: 'jane_smith',
    comments: 'Declined Medicare supplement',
    first_name: 'Mary',
    last_name: 'Johnson',
    vendor_lead_code: 'EXT_002',
    recording_id: 'REC_001235',
    filename: '20241223-103500_123457.wav'
  }
];

module.exports = mockVicidialCalls;
```

### Unit Tests
```javascript
// test/vicidialMapper.test.js
const VicidialMapper = require('../utils/vicidialMapper');
const mockData = require('./mockVicidialData');

describe('VicidialMapper', () => {
  test('maps SALE call correctly', () => {
    const result = VicidialMapper.mapCallLog(mockData[0]);

    expect(result.callId).toBe('VD_1734987654.12345');
    expect(result.campaign).toBe('ACA');
    expect(result.disposition).toBe('SALE');
    expect(result.isSale).toBe(true);
    expect(result.requiresQA).toBe(true);
  });

  test('maps DECLINE call correctly', () => {
    const result = VicidialMapper.mapCallLog(mockData[1]);

    expect(result.callId).toBe('VD_1734987800.67890');
    expect(result.campaign).toBe('Medicare');
    expect(result.disposition).toBe('DEC');
    expect(result.isSale).toBe(false);
    expect(result.requiresQA).toBe(false);
  });
});
```

## Configuration

### Environment Variables
```bash
# Vicidial Database Connection
VICIDIAL_DB_HOST=your-vicidial-server.com
VICIDIAL_DB_USER=readonly_user
VICIDIAL_DB_PASS=secure_password
VICIDIAL_DB_NAME=asterisk

# Vicidial API
VICIDIAL_API_URL=https://your-vicidial.com/agc
VICIDIAL_API_USER=api_user
VICIDIAL_API_PASS=api_password

# Webhook Configuration
VICIDIAL_WEBHOOK_SECRET=your_webhook_secret
```

### Database Indexes (for performance)
```javascript
// Add to Call model
callSchema.index({ externalCallId: 1 }); // Vicidial lead_id
callSchema.index({ callId: 1 }); // Already exists but ensure
callSchema.index({ disposition: 1 }); // Vicidial status
```

This mapping guide provides a complete blueprint for Vicidial integration without requiring actual Vicidial access. The code examples show exactly how Vicidial data would be transformed and stored in your existing MongoDB schema, maintaining all your current AI processing and analytics capabilities.