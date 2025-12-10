# Production Architecture for 50-60 Agent Call Center

## Current Problem: Single-Server Bottleneck

### Reality Check:
- **50 agents** calling non-stop = ~400-600 calls/hour during peak
- **Current AI service**: 1 call per 45-90 seconds = ~40-80 calls/hour MAX
- **Backlog growth**: 320-520 calls/hour piling up ❌

### System Will Crash Within 2 Hours of Operation

---

## Solution: Distributed Processing Architecture

### Architecture Overview

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (Nginx)      │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼───────┐
    │  Backend API │  │ Backend API │  │ Backend API │
    │   (Node.js)  │  │  (Node.js)  │  │  (Node.js)  │
    └──────┬───────┘  └──────┬──────┘  └──────┬──────┘
           │                 │                 │
           └────────┬────────┴────────┬────────┘
                    │                 │
           ┌────────▼─────────────────▼────────┐
           │      Message Queue (Redis)        │
           │      - Upload Queue               │
           │      - Processing Queue           │
           │      - Completed Queue            │
           └────────┬──────────────────────────┘
                    │
        ┌───────────┼───────────┬───────────┐
        │           │           │           │
   ┌────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐
   │AI Worker│ │AI Worker│ │AI Worker│ │AI Worker│
   │ GPU #1  │ │ GPU #2  │ │ GPU #3  │ │ GPU #4  │
   │(FastAPI)│ │(FastAPI)│ │(FastAPI)│ │(FastAPI)│
   └─────────┘ └─────────┘ └─────────┘ └─────────┘
        │           │           │           │
        └───────────┴───────────┴───────────┘
                    │
           ┌────────▼──────────┐
           │   MongoDB Atlas   │
           │  (Call Records)   │
           └───────────────────┘
```

---

## Required Infrastructure

### Option 1: On-Premise (Recommended for BPO)

#### Hardware Requirements:
```
1× Application Server (Backend + Redis)
   - CPU: 8-core
   - RAM: 32GB
   - Storage: 500GB SSD
   - Cost: ~$1,500

4× GPU Worker Servers
   - CPU: 6-core
   - RAM: 16GB
   - GPU: NVIDIA RTX 3060 (12GB VRAM) or better
   - Storage: 256GB SSD
   - Cost: ~$1,200 each × 4 = $4,800

Total Hardware: ~$6,300
Processing Capacity: 400-600 calls/hour
```

#### Alternative: Single High-End Server
```
1× Powerful Server
   - CPU: AMD Threadripper 16-core
   - RAM: 64GB
   - GPU: 4× NVIDIA RTX 3060 (or 2× RTX 4090)
   - Storage: 1TB NVMe SSD
   - Cost: ~$8,000-10,000

Processing Capacity: 500-800 calls/hour
```

---

### Option 2: Cloud Infrastructure (Easier Scaling)

#### AWS Configuration:
```yaml
Backend (3× instances):
  Type: t3.medium
  vCPU: 2
  RAM: 4GB
  Cost: $0.0416/hour × 3 = $90/month

AI Workers (4× GPU instances):
  Type: g4dn.xlarge
  vCPU: 4
  RAM: 16GB
  GPU: NVIDIA T4 (16GB)
  Cost: $0.526/hour × 4 = $1,520/month

Redis/Queue:
  Type: ElastiCache t3.medium
  Cost: $50/month

Storage (Audio Files):
  S3: 500GB/month = $12/month

Total Monthly: ~$1,672/month
Annual: ~$20,000/year
```

#### Google Cloud (Cheaper Alternative):
```yaml
AI Workers (4× instances):
  Type: n1-standard-4 + NVIDIA T4
  Cost: ~$1,200/month

Total Monthly: ~$1,400/month
Annual: ~$16,800/year
```

---

## Implementation Changes Required

### 1. Add Message Queue System

**Install Redis:**
```bash
# Backend package.json
npm install bull ioredis
```

**Create Queue Manager:**
```javascript
// backend/src/queues/callProcessingQueue.js
const Queue = require('bull');
const logger = require('../config/logger');

const callQueue = new Queue('call-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  settings: {
    maxStalledCount: 3,
    stalledInterval: 30000,
  },
});

// Add job to queue
exports.queueCallProcessing = async (callId, audioPath) => {
  const job = await callQueue.add(
    {
      callId,
      audioPath,
      timestamp: Date.now(),
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: false,
    }
  );
  
  logger.info('Call queued for processing', { 
    callId, 
    jobId: job.id 
  });
  
  return job.id;
};

// Process jobs (in separate worker process)
callQueue.process(4, async (job) => {
  const { callId, audioPath } = job.data;
  
  // Update status
  await Call.findByIdAndUpdate(callId, { 
    status: 'processing' 
  });
  
  // Call AI service
  const result = await processCallAsync(callId, audioPath);
  
  // Update with results
  await Call.findByIdAndUpdate(callId, {
    ...result,
    status: 'completed',
    processedAt: new Date(),
  });
  
  logger.info('Call processed successfully', { callId });
});

// Monitor queue
callQueue.on('failed', (job, err) => {
  logger.error('Call processing failed', {
    jobId: job.id,
    callId: job.data.callId,
    error: err.message,
  });
});

module.exports = callQueue;
```

### 2. Update Upload Controller (Instant Response)

```javascript
// backend/src/controllers/callController.js
const { queueCallProcessing } = require('../queues/callProcessingQueue');

exports.uploadCall = [
  upload.single('audio'),
  async (req, res, next) => {
    try {
      // ... validation ...

      // Create call record immediately
      const call = await Call.create({
        callId: uuidv4(),
        agentId: req.body.agentId,
        agentName: req.body.agentName,
        campaign: req.body.campaign,
        duration: parseInt(req.body.duration),
        callDate: new Date(req.body.callDate),
        audioPath: req.file.path,
        status: 'queued',  // ← Changed from 'uploaded'
        uploadedBy: req.user.id,
      });

      // Queue for background processing
      const jobId = await queueCallProcessing(call._id, req.file.path);

      // Return immediately (don't wait for processing)
      res.status(201).json({
        success: true,
        message: 'Call uploaded and queued for processing',
        data: {
          call,
          jobId,
          estimatedProcessingTime: '2-5 minutes',
        },
      });

    } catch (error) {
      next(error);
    }
  },
];
```

### 3. Create Dedicated Worker Process

```javascript
// backend/src/workers/callProcessor.js
const connectDB = require('../config/database');
const logger = require('../config/logger');
require('../queues/callProcessingQueue'); // Starts processing

connectDB();

logger.info('Call processing worker started', {
  concurrency: 4,
  mode: 'GPU',
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Worker shutting down...');
  await callQueue.close();
  process.exit(0);
});
```

**Run Workers:**
```json
// package.json
{
  "scripts": {
    "worker": "node src/workers/callProcessor.js",
    "worker:dev": "nodemon src/workers/callProcessor.js"
  }
}
```

### 4. AI Service Load Balancer

**nginx.conf:**
```nginx
upstream ai_workers {
    least_conn;
    server ai-worker-1:8000 max_fails=3 fail_timeout=30s;
    server ai-worker-2:8000 max_fails=3 fail_timeout=30s;
    server ai-worker-3:8000 max_fails=3 fail_timeout=30s;
    server ai-worker-4:8000 max_fails=3 fail_timeout=30s;
}

server {
    listen 8080;
    
    location / {
        proxy_pass http://ai_workers;
        proxy_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

---

## Deployment Strategy

### Phase 1: Single Server with Queue (Week 1)
- Add Redis queue
- Async processing
- Test with 10 agents
- **Capacity:** 80-100 calls/hour

### Phase 2: Add GPU (Week 2)
- Install NVIDIA GPU + CUDA
- Switch to `DEVICE=cuda`
- Test with 20 agents
- **Capacity:** 200-300 calls/hour

### Phase 3: Multi-Worker (Week 3-4)
- Deploy 4 AI worker servers
- Load balancer
- Full 50-60 agent test
- **Capacity:** 500+ calls/hour

---

## Critical Metrics to Monitor

### Real-Time Dashboard:
```javascript
// GET /api/stats/processing
{
  "queueStats": {
    "waiting": 45,
    "active": 4,
    "completed": 1247,
    "failed": 3,
    "avgProcessingTime": "23 seconds"
  },
  "workers": {
    "online": 4,
    "offline": 0,
    "cpuUsage": "45%",
    "memoryUsage": "8.2GB / 64GB"
  },
  "throughput": {
    "callsPerHour": 487,
    "peakHour": "14:00-15:00",
    "backlog": "12 minutes"
  }
}
```

---

## Cost-Benefit Analysis

### Option A: On-Premise ($6,300 one-time)
- **Pros:** No monthly fees, full control, data security
- **Cons:** Hardware maintenance, power costs (~$100/month)
- **Break-even:** 4 months vs cloud

### Option B: Cloud ($1,400-1,700/month)
- **Pros:** No hardware, auto-scaling, managed services
- **Cons:** Ongoing costs, data transfer to cloud
- **Annual:** ~$17,000-20,000

### Recommendation for BPO:
**Hybrid Approach:**
1. Start with cloud (3 months testing) = $5,000
2. If successful, migrate to on-premise = $6,300
3. Total first year: $11,300
4. Year 2+: Only power costs (~$1,200/year)

---

## Immediate Action Items

### This Week:
1. ✅ Install Redis locally
2. ✅ Implement queue system
3. ✅ Test async processing with 5 sample calls
4. ✅ Measure actual processing times

### Next Week:
1. ⬜ Decide: Cloud vs On-Premise
2. ⬜ If Cloud: Set up AWS/GCP account
3. ⬜ If On-Premise: Order GPU servers
4. ⬜ Deploy worker infrastructure

### Week 3-4:
1. ⬜ Load testing with 20 agents
2. ⬜ Optimize worker count based on metrics
3. ⬜ Set up monitoring dashboard
4. ⬜ Train QA team on system

---

## Alternative: Simplified Real-Time Processing

If you want **immediate results** (not queued):

### Use Commercial API (Violates free requirement, but practical):
```javascript
// Option: Deepgram API (99% accurate, $0.0043/minute)
// Cost for 4,800 calls/day × 5 min = 24,000 min/day
// = $103/day = $3,000/month

// BUT: Results in <5 seconds, no infrastructure needed
```

---

**Bottom Line:** 
Your current setup is **not viable** for production. You need:
1. **Message queue** (immediate)
2. **GPU acceleration** (this week)
3. **Multiple workers** (within 2 weeks)

**Recommended Path:** Start with cloud deployment for 3 months while evaluating on-premise hardware.
