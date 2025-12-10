# Transfer-Only QA Strategy - Cost Optimization

## Volume Reality Check

### Typical BPO Transfer Rates:
- **Total calls:** 50 agents × 8 hours × 12 calls/hour = **4,800 calls/day**
- **Transfer rate:** 5-15% (industry average)
- **Calls to QA:** 240-720 calls/day (vs 4,800 full volume)

### **Processing Load Reduction: 85-95%** ✅

---

## New Infrastructure Requirements

### Option 1: Single PC with GPU (VIABLE NOW!)

**Hardware:**
```
1× Workstation PC
- CPU: Intel i5/i7 or AMD Ryzen 5/7
- RAM: 16GB
- GPU: NVIDIA RTX 3060 (12GB VRAM) - $300-400
- Storage: 512GB SSD

Total Cost: $1,200-1,500 (one-time)
```

**Processing Capacity:**
- With GPU: 120-180 calls/hour
- Your need: 30-90 calls/hour (720 calls ÷ 8 hours)
- **Headroom: 2-3x capacity** ✅

**Recommended Setup:**
```env
# ai-service/.env
WHISPER_MODEL=medium     # Use better quality now!
DEVICE=cuda              # GPU acceleration
WORKER_CONCURRENCY=2     # Process 2 calls simultaneously
```

---

### Option 2: Cloud (Minimal Cost)

**GCP Configuration:**
```
1× Backend API (t3.small): $15/month
1× AI Worker (n1-standard-4 + T4 GPU): $511/month
1× Redis (1GB): $36/month

TOTAL: $562/month
With auto-shutdown (16h/day off): $280/month

Annual: $3,360 (full time) or $1,680 (auto-shutdown)
```

**AWS Configuration:**
```
1× Backend (t3.small): $15/month
1× GPU Worker (g4dn.xlarge): $384/month
1× Redis (cache.t3.micro): $12/month

TOTAL: $411/month
With reserved instance: $288/month

Annual: $3,456 (full time) or $2,880 (reserved)
```

---

## Recommended Solution: Single GPU PC

### Why It Makes Sense Now:

**Cost Comparison (3 years):**
```
On-Premise GPU PC:
- Initial: $1,500
- Power: $30/month × 36 = $1,080
- TOTAL: $2,580

Cloud (minimal):
- $280/month × 36 = $10,080

SAVINGS: $7,500 over 3 years with on-premise
```

**Processing Speed:**
- Current (CPU): 2-5 minutes/call
- With RTX 3060: 15-30 seconds/call
- With RTX 4070: 10-20 seconds/call

---

## Workflow Changes Needed

### 1. Add Transfer Flag to Call Upload

**Update Call Model:**
```javascript
// backend/src/models/Call.js
const callSchema = new mongoose.Schema({
  // ... existing fields ...
  
  isTransferred: {
    type: Boolean,
    default: false,
    required: true,
  },
  transferredTo: {
    type: String, // License agent ID or name
    default: '',
  },
  transferReason: {
    type: String,
    default: '',
  },
  transferredAt: {
    type: Date,
  },
  requiresQA: {
    type: Boolean,
    default: false, // Only true for transferred calls
  },
});
```

### 2. Filter Queue Processing

**Update Upload Controller:**
```javascript
// backend/src/controllers/callController.js

exports.uploadCall = async (req, res, next) => {
  try {
    const { 
      agentId, 
      agentName, 
      campaign, 
      duration, 
      callDate,
      isTransferred,      // NEW
      transferredTo,      // NEW
      transferReason      // NEW
    } = req.body;

    // Create call record
    const call = await Call.create({
      callId: uuidv4(),
      agentId,
      agentName,
      campaign,
      duration: parseInt(duration),
      callDate: new Date(callDate),
      audioPath: req.file.path,
      isTransferred: isTransferred === 'true' || isTransferred === true,
      transferredTo: transferredTo || '',
      transferReason: transferReason || '',
      transferredAt: isTransferred ? new Date() : null,
      requiresQA: isTransferred === 'true' || isTransferred === true, // Only QA transfers
      status: (isTransferred === 'true' || isTransferred === true) ? 'queued' : 'uploaded',
      uploadedBy: req.user.id,
    });

    // ONLY queue for AI processing if transferred
    if (call.requiresQA) {
      const jobId = await queueCallProcessing(call._id, req.file.path, {
        priority: 1, // High priority for QA calls
        isTransfer: true,
      });

      return res.status(201).json({
        success: true,
        message: 'Transfer call queued for QA analysis',
        data: {
          call,
          jobId,
          estimatedProcessingTime: '30-60 seconds',
        },
      });
    } else {
      // Non-transferred calls: store but don't process
      return res.status(201).json({
        success: true,
        message: 'Call uploaded (no QA required)',
        data: { call },
      });
    }

  } catch (error) {
    next(error);
  }
};
```

### 3. Update Frontend Upload Form

**Add Transfer Fields:**
```jsx
// frontend/src/pages/UploadCall.jsx

const [formData, setFormData] = useState({
  agentId: '',
  agentName: '',
  campaign: '',
  duration: '',
  callDate: '',
  audioFile: null,
  isTransferred: false,      // NEW
  transferredTo: '',         // NEW
  transferReason: ''         // NEW
});

// In the form JSX:
<div className="space-y-4">
  {/* Existing fields... */}
  
  <div className="flex items-center">
    <input
      type="checkbox"
      id="isTransferred"
      checked={formData.isTransferred}
      onChange={(e) => setFormData({ 
        ...formData, 
        isTransferred: e.target.checked 
      })}
      className="mr-2"
    />
    <label htmlFor="isTransferred" className="font-medium">
      This call was transferred to a licensed agent
    </label>
  </div>

  {formData.isTransferred && (
    <>
      <div>
        <label className="block font-medium mb-1">
          Transferred To (Agent ID/Name)
        </label>
        <input
          type="text"
          value={formData.transferredTo}
          onChange={(e) => setFormData({ 
            ...formData, 
            transferredTo: e.target.value 
          })}
          className="input"
          placeholder="e.g., AGT-5678 or John Doe"
        />
      </div>
      
      <div>
        <label className="block font-medium mb-1">
          Transfer Reason
        </label>
        <select
          value={formData.transferReason}
          onChange={(e) => setFormData({ 
            ...formData, 
            transferReason: e.target.value 
          })}
          className="input"
        >
          <option value="">Select reason...</option>
          <option value="Complex Issue">Complex Issue</option>
          <option value="Customer Request">Customer Request</option>
          <option value="Escalation">Escalation</option>
          <option value="Authorization Required">Authorization Required</option>
          <option value="Technical Issue">Technical Issue</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </>
  )}
</div>
```

---

## VicidiaL Integration (Automatic Transfer Detection)

### Option 1: Database Query (Best for VicidiaL)

**VicidiaL tracks transfers in `vicidial_log` table:**
```sql
-- Query to get transferred calls
SELECT 
  uniqueid,
  lead_id,
  user,
  campaign_id,
  status,
  xfercallid,
  closecallid
FROM vicidial_log
WHERE status IN ('XFER', 'CLOSER')
  AND call_date >= CURDATE()
  AND xfercallid IS NOT NULL;
```

**Create sync script:**
```javascript
// backend/src/services/vicidialSync.js
const mysql = require('mysql2/promise');
const logger = require('../config/logger');

const vicidialDB = mysql.createPool({
  host: process.env.VICIDIAL_DB_HOST,
  user: process.env.VICIDIAL_DB_USER,
  password: process.env.VICIDIAL_DB_PASSWORD,
  database: process.env.VICIDIAL_DB_NAME || 'asterisk',
});

exports.getTransferredCalls = async (startDate, endDate) => {
  try {
    const [rows] = await vicidialDB.query(`
      SELECT 
        vl.uniqueid as callId,
        vl.user as agentId,
        vu.full_name as agentName,
        vl.campaign_id as campaign,
        vl.length_in_sec as duration,
        vl.call_date as callDate,
        vl.xfercallid,
        vu2.full_name as transferredTo,
        vl.status as transferReason,
        rec.location as recordingPath
      FROM vicidial_log vl
      LEFT JOIN vicidial_users vu ON vl.user = vu.user
      LEFT JOIN vicidial_users vu2 ON vl.xfer_user = vu2.user
      LEFT JOIN recording_log rec ON vl.uniqueid = rec.vicidial_id
      WHERE vl.status IN ('XFER', 'CLOSER')
        AND vl.call_date >= ?
        AND vl.call_date <= ?
        AND vl.xfercallid IS NOT NULL
      ORDER BY vl.call_date DESC
    `, [startDate, endDate]);

    logger.info('Fetched transferred calls from VicidiaL', { 
      count: rows.length 
    });

    return rows;
  } catch (error) {
    logger.error('VicidiaL sync error', { error: error.message });
    throw error;
  }
};

// Auto-import transferred calls
exports.syncTransferredCalls = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const transfers = await this.getTransferredCalls(
      `${today} 00:00:00`,
      `${today} 23:59:59`
    );

    for (const transfer of transfers) {
      // Check if recording exists
      if (!transfer.recordingPath) continue;

      // Check if already imported
      const existing = await Call.findOne({ 
        callId: transfer.callId 
      });
      if (existing) continue;

      // Import call for QA
      await Call.create({
        callId: transfer.callId,
        agentId: transfer.agentId,
        agentName: transfer.agentName,
        campaign: transfer.campaign,
        duration: transfer.duration,
        callDate: new Date(transfer.callDate),
        audioPath: transfer.recordingPath,
        isTransferred: true,
        transferredTo: transfer.transferredTo,
        transferReason: transfer.transferReason,
        transferredAt: new Date(transfer.callDate),
        requiresQA: true,
        status: 'queued',
      });

      // Queue for processing
      await queueCallProcessing(transfer.callId, transfer.recordingPath, {
        priority: 1,
        isTransfer: true,
      });
    }

    logger.info('VicidiaL sync completed', { 
      imported: transfers.length 
    });

  } catch (error) {
    logger.error('VicidiaL sync failed', { error: error.message });
  }
};
```

**Schedule automatic sync:**
```javascript
// backend/src/jobs/vicidialSync.js
const cron = require('node-cron');
const { syncTransferredCalls } = require('../services/vicidialSync');
const logger = require('../config/logger');

// Run every hour
cron.schedule('0 * * * *', async () => {
  logger.info('Starting VicidiaL transfer sync');
  await syncTransferredCalls();
});

logger.info('VicidiaL sync job scheduled (hourly)');
```

---

## Updated Cost Analysis

### Processing Only Transfers (10% of calls)

| Solution | Setup Cost | Monthly Cost | Annual Cost |
|----------|------------|--------------|-------------|
| **Single GPU PC** | **$1,500** | **$30** (power) | **$1,860** ⭐⭐⭐ |
| **Cloud (auto-shutdown)** | $0 | $280 | $3,360 |
| **Cloud (24/7)** | $0 | $562 | $6,744 |

### **Recommendation: Buy Single GPU PC**

**Hardware Specs:**
```
Custom Build:
- CPU: AMD Ryzen 5 5600 ($130)
- GPU: NVIDIA RTX 3060 12GB ($350)
- RAM: 16GB DDR4 ($40)
- Motherboard: B550 ($100)
- Storage: 512GB NVMe ($40)
- PSU: 650W ($60)
- Case: Mid-tower ($50)

TOTAL: ~$770 (DIY build)

OR Pre-built:
- Dell/HP Workstation with RTX 3060: $1,200-1,500
```

**ROI vs Cloud:**
- Breaks even in **Month 3** vs auto-shutdown cloud
- Breaks even in **Month 1** vs 24/7 cloud
- Saves **$5,000+** over 3 years

---

## Implementation Priority

### Week 1: Database Changes
```bash
# Add transfer fields to Call model
# Update validation rules
# Test with sample data
```

### Week 2: Frontend Updates
```bash
# Add transfer checkbox and fields
# Update API calls
# Test upload flow
```

### Week 3: VicidiaL Integration
```bash
# Install mysql2: npm install mysql2
# Configure database connection
# Test sync script
# Schedule hourly sync
```

### Week 4: GPU Setup
```bash
# Install/configure GPU
# Install CUDA toolkit
# Switch to DEVICE=cuda
# Load test with real transfers
```

---

## Monitoring Dashboard Updates

**Add Transfer-Specific Metrics:**
```javascript
// GET /api/reports/transfer-stats
{
  "today": {
    "totalCalls": 4800,
    "transferredCalls": 384,
    "transferRate": "8%",
    "qaProcessed": 384,
    "qaBacklog": 0,
    "avgProcessingTime": "18 seconds"
  },
  "topTransferReasons": [
    { "reason": "Complex Issue", "count": 145 },
    { "reason": "Escalation", "count": 98 },
    { "reason": "Authorization Required", "count": 76 }
  ],
  "topTransferAgents": [
    { "agent": "AGT-1234", "transfers": 23 },
    { "agent": "AGT-5678", "transfers": 19 }
  ]
}
```

---

## Summary

### With Transfer-Only QA:

✅ **Single GPU PC is now viable** ($1,500 one-time)
✅ **90% cost reduction** vs full call volume
✅ **Real-time processing** (15-30 sec/call)
✅ **No monthly cloud fees**
✅ **VicidiaL auto-sync** for seamless integration

### Next Steps:

1. **Confirm transfer rate** - Check VicidiaL reports for actual %
2. **Order GPU PC** - RTX 3060 or better
3. **Update database schema** - Add transfer fields
4. **Integrate with VicidiaL** - Auto-import transfers
5. **Test with 1 week of data** - Validate processing speed

**Estimated Timeline:** 2-3 weeks to full production
**Estimated Cost:** $1,500 hardware + $30/month power
