# Vicidial Integration Examples

## Data Flow Examples

### Example 1: Outbound ACA Campaign Call

**Vicidial Database Data:**
```sql
-- vicidial_list table
lead_id: 123456
list_id: ACA_Outbound
phone_number: 555-0123
first_name: John
last_name: Smith
vendor_lead_code: ACA_LEAD_001
status: SALE

-- vicidial_log table
uniqueid: 1734987654.12345
lead_id: 123456
campaign_id: ACA_Outbound
call_date: 2024-12-23 14:30:00
length_in_sec: 420
status: SALE
phone_number: 555-0123
user: sarah_johnson
comments: Sold ACA Advantage plan - $89/month

-- vicidial_recordings table
recording_id: REC_001234
lead_id: 123456
filename: 20241223-143000_123456.wav
location: /var/spool/asterisk/monitor/2024/12/23/20241223-143000_123456.wav
length_in_sec: 420
```

**Mapped to Your Application:**
```javascript
{
  callId: "VD_1734987654.12345",
  externalCallId: "123456",
  customerPhone: "555-0123",
  customerName: "John Smith",
  customerId: "ACA_LEAD_001",
  agentName: "sarah_johnson",
  campaign: "ACA",
  callDate: "2024-12-23T14:30:00.000Z",
  duration: 420,
  disposition: "SALE",
  status: "completed",
  audioFilePath: "REC_001234",
  audioFileName: "20241223-143000_123456.wav",
  notes: "Sold ACA Advantage plan - $89/month",
  isSale: true,
  requiresQA: true,
  agentId: ObjectId("507f1f77bcf86cd799439011"), // From User lookup
  uploadedBy: ObjectId("507f1f77bcf86cd799439011")
}
```

**AI Processing Results Added:**
```javascript
{
  // ... existing fields
  transcript: "Hello, this is Sarah calling from NextelBPO about ACA health insurance options...",
  sentiment: "positive",
  sentimentScore: 0.85,
  complianceScore: 92,
  qualityScore: 88,
  missingMandatoryPhrases: [],
  detectedForbiddenPhrases: [],
  summary: "Agent successfully sold ACA Advantage plan, explained benefits clearly, maintained professional tone throughout call.",
  keyPhrases: ["ACA Advantage", "monthly premium", "coverage options", "enrollment period"],
  agentTalkTime: 280,
  customerTalkTime: 140,
  talkTimeRatio: "67/33"
}
```

### Example 2: Inbound Medicare Call - No Sale

**Vicidial Data:**
```sql
lead_id: 123457
list_id: Medicare_Inbound
phone_number: 555-0456
first_name: Mary
last_name: Johnson
status: DEC

uniqueid: 1734987800.67890
lead_id: 123457
campaign_id: Medicare_Inbound
call_date: 2024-12-23 14:35:00
length_in_sec: 180
status: DEC
user: mike_davis
comments: Declined Medicare supplement - already has coverage

recording_id: REC_001235
filename: 20241223-143500_123457.wav
```

**Your Application Record:**
```javascript
{
  callId: "VD_1734987800.67890",
  campaign: "Medicare",
  customerName: "Mary Johnson",
  agentName: "mike_davis",
  disposition: "DEC",
  duration: 180,
  isSale: false,
  requiresQA: false,
  // AI analysis would still run for quality monitoring
  complianceScore: 95,
  qualityScore: 82,
  summary: "Agent provided Medicare information but customer declined due to existing coverage."
}
```

### Example 3: Final Expense Campaign - Busy Signal

**Vicidial Data:**
```sql
status: B (Busy)
length_in_sec: 15
comments: Busy signal - will call back
```

**Your Application Record:**
```javascript
{
  callId: "VD_1734987900.11111",
  campaign: "Final Expense",
  disposition: "B",
  status: "completed",
  duration: 15,
  isSale: false,
  requiresQA: false,
  // Minimal AI processing for short calls
  transcript: "The number you are calling is busy. Please try again later.",
  qualityScore: 0 // Not applicable for system messages
}
```

## Integration Testing Scenarios

### Scenario 1: Database Sync Test
```javascript
// Test script to verify data mapping
const VicidialService = require('./services/vicidialService');
const vicidialService = new VicidialService();

async function testSync() {
  try {
    const result = await vicidialService.syncCallLogs(
      new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );
    console.log('Sync Result:', result);
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

testSync();
```

### Scenario 2: Webhook Test
```bash
# Test webhook with sample data
curl -X POST http://localhost:5000/api/webhooks/vicidial/call-complete \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueid": "1734987654.12345",
    "lead_id": "123456",
    "campaign_id": "ACA_Outbound",
    "call_date": "2024-12-23 14:30:00",
    "length_in_sec": "420",
    "status": "SALE",
    "phone_number": "555-0123",
    "user": "sarah_johnson",
    "first_name": "John",
    "last_name": "Smith",
    "recording_id": "REC_001234",
    "filename": "20241223-143000_123456.wav"
  }'
```

### Scenario 3: Campaign Filtering Test
```javascript
// Test campaign-specific analytics
const result = await Call.find({
  campaign: "ACA",
  callDate: {
    $gte: new Date("2024-12-23"),
    $lt: new Date("2024-12-24")
  }
}).countDocuments();

console.log(`ACA calls today: ${result}`);
```

## Configuration Examples

### Vicidial Campaign Setup
```
Campaign ID: ACA_Outbound
Campaign Name: ACA Outbound Sales
Lists: ACA_Leads, ACA_Prospects
Script: ACA_Sales_Script.txt
Statuses: SALE, DEC, DNC, NI, B
```

### Vicidial Webhook Configuration
```
Disposition URL: http://your-app.com/api/webhooks/vicidial/call-complete
Method: POST
Content Type: application/json
Fields to send: All call and lead fields
```

### Your Application Environment Variables
```bash
VICIDIAL_DB_HOST=your-vicidial-server.com
VICIDIAL_DB_USER=readonly_user
VICIDIAL_DB_PASS=secure_password
VICIDIAL_DB_NAME=asterisk
```

## Monitoring and Alerts

### Key Metrics to Monitor
1. **Sync Success Rate**: Calls successfully imported vs failed
2. **Data Latency**: Time between Vicidial call completion and your system processing
3. **Recording Availability**: Percentage of calls with accessible recordings
4. **Agent Matching**: Success rate of Vicidial user → your User lookup

### Alert Conditions
- Sync failures > 5% of attempts
- Latency > 30 minutes
- Recording access failures > 10%
- Agent lookup failures > 20%

## Troubleshooting Common Issues

### Issue 1: Agent Not Found
```
Error: Agent "john_doe" not found in User collection
Solution: Ensure Vicidial usernames match your User.name field
```

### Issue 2: Recording Not Accessible
```
Error: Recording file REC_001234 not found
Solution: Configure shared storage or SFTP transfer for recordings
```

### Issue 3: Duplicate Calls
```
Error: Call VD_1734987654.12345 already exists
Solution: Check sync logic to prevent duplicates
```

### Issue 4: Campaign Mapping Issues
```
Error: Unknown campaign "ACA_New"
Solution: Update campaign mapping in VicidialMapper.mapCampaign()
```

This integration allows your AI-powered quality assurance system to automatically process every call from Vicidial, providing real-time insights and maintaining 100% call coverage for your ACA, Medicare, and Final Expense campaigns.