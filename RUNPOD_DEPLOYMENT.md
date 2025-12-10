# RunPod Deployment Guide - AI Call Center

## Your RunPod Configuration

**Instance:** RTX A4500 (20 GB VRAM)
- **vCPU:** 12 cores
- **RAM:** 54 GB
- **Storage:** 80 GB
- **GPU:** NVIDIA RTX A4500 (20GB VRAM) - CUDA enabled

**Pricing:**
- Running: **$0.261/hour** ($0.25 GPU + $0.011 disk)
- Stopped: **$0.014/hour** (disk only)

---

## Monthly Cost Analysis

### Scenario 1: Running 8 Hours/Day (Business Hours Only)
```
Running time: 8 hours × 30 days = 240 hours
Running cost: 240 × $0.261 = $62.64

Stopped time: 16 hours × 30 days = 480 hours
Stopped cost: 480 × $0.014 = $6.72

TOTAL: $69.36/month ✅ (Well under $100 budget!)
```

### Scenario 2: Running 10 Hours/Day
```
Running time: 10 hours × 30 days = 300 hours
Running cost: 300 × $0.261 = $78.30

Stopped time: 14 hours × 30 days = 420 hours
Stopped cost: 420 × $0.014 = $5.88

TOTAL: $84.18/month ✅
```

### Scenario 3: Running 24/7 (Not Recommended)
```
Running time: 24 × 30 = 720 hours
Running cost: 720 × $0.261 = $187.92

TOTAL: $187.92/month ❌ (Over budget)
```

---

## Performance Capacity

### Your RTX A4500 Can Handle:

**Processing Speed:**
- Whisper medium: **5-10 seconds/call**
- Full pipeline (transcribe + sentiment + NER + diarization + summarization): **15-25 seconds/call**

**Throughput:**
- **2-3 concurrent calls** processing simultaneously
- **120-180 calls/hour** capacity
- **960-1,800 calls/day** (8 hours)

**Your Requirements:**
- ~400-500 transferred calls/day
- ~50-70 calls/hour during peak

**Result:** RTX A4500 has **2-3x more capacity than needed** ✅

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                 RunPod Pod                          │
│  (RTX A4500, 54GB RAM, 12 vCPU, 80GB Storage)      │
│                                                     │
│  ┌─────────────────┐  ┌──────────────────┐        │
│  │  Backend API    │  │  AI Service      │        │
│  │  (Node.js)      │  │  (Python/CUDA)   │        │
│  │  Port 5000      │  │  Port 8000       │        │
│  └────────┬────────┘  └────────┬─────────┘        │
│           │                    │                   │
│           └──────┬─────────────┘                   │
│                  │                                 │
│         ┌────────▼────────┐                        │
│         │  Redis Queue    │                        │
│         │  (localhost)    │                        │
│         └─────────────────┘                        │
│                                                     │
└─────────────────────────────────────────────────────┘
                      │
                      │ HTTPS
                      ▼
        ┌──────────────────────────┐
        │    MongoDB Atlas         │
        │  (External - Existing)   │
        └──────────────────────────┘
```

---

## Step-by-Step Deployment

### 1. Create RunPod Pod

**Template Configuration:**
```
Base Image: runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04
OR
Base Image: nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

GPU: RTX A4500 (20GB)
Container Disk: 80GB
Expose Ports: 5000, 8000, 6379
```

### 2. Initial Setup (SSH into pod)

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Redis
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Install Python dependencies
apt-get install -y python3-pip git

# Install system dependencies for audio processing
apt-get install -y ffmpeg libsndfile1

# Verify CUDA
nvidia-smi
nvcc --version
```

### 3. Clone and Setup Application

```bash
# Clone repository
cd /workspace
git clone <your-repository-url> AI_CALL_CENTER
cd AI_CALL_CENTER

# Setup Backend
cd backend
npm install
npm install pm2 -g

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://Nextel:Nextel123@cluster0.9eph1nl.mongodb.net/AICallCenter
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
AI_SERVICE_URL=http://localhost:8000
UPLOAD_DIR=/workspace/uploads
REDIS_HOST=localhost
REDIS_PORT=6379
WORKER_CONCURRENCY=3
LOG_LEVEL=info
LOG_DIR=/workspace/logs
EOF

# Setup AI Service
cd ../ai-service
pip install --upgrade pip
pip install -r requirements.txt
python setup.py

# Create .env file
cat > .env << EOF
PORT=8000
HOST=0.0.0.0
WHISPER_MODEL=medium
DEVICE=cuda
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
SPACY_MODEL=en_core_web_sm
SUMMARIZATION_MODEL=facebook/bart-large-cnn
HF_TOKEN=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
ALLOWED_ORIGINS=http://localhost:5000,https://*.proxy.runpod.net
MAX_WORKERS=3
EOF
```

### 4. Download AI Models (First Run)

```bash
cd /workspace/AI_CALL_CENTER/ai-service

# This will download models to /root/.cache/
# Models persist as long as pod storage is not deleted
python3 << EOF
import whisper
import spacy
from transformers import pipeline

print("Downloading Whisper medium...")
whisper.load_model("medium")

print("Downloading DistilBERT...")
pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

print("Downloading BART...")
pipeline("summarization", model="facebook/bart-large-cnn")

print("Downloading spaCy model...")
spacy.cli.download("en_core_web_sm")

print("All models downloaded!")
EOF
```

### 5. Start Services with PM2

```bash
cd /workspace/AI_CALL_CENTER

# Start AI Service
pm2 start ai-service/main.py --name ai-service --interpreter python3

# Start Backend API
cd backend
pm2 start src/server.js --name backend-api

# Start Worker (for queue processing)
pm2 start src/workers/callProcessor.js --name call-worker

# Save PM2 configuration
pm2 save
pm2 startup

# View logs
pm2 logs

# Monitor processes
pm2 monit
```

### 6. Configure RunPod Proxy

**In RunPod Dashboard:**
1. Go to your pod settings
2. Under "Port Mappings", expose:
   - Port `5000` → Backend API
   - Port `8000` → AI Service
3. Get your proxy URLs:
   - Backend: `https://your-pod-id-5000.proxy.runpod.net`
   - AI Service: `https://your-pod-id-8000.proxy.runpod.net`

### 7. Update Frontend Configuration

```bash
# frontend/.env.production
VITE_API_URL=https://your-pod-id-5000.proxy.runpod.net/api
```

---

## Auto-Shutdown Configuration

### Create Auto-Shutdown Script

```bash
# Create shutdown script
cat > /workspace/auto-shutdown.sh << 'EOF'
#!/bin/bash

# Check if queue is empty and no active processing
QUEUE_STATS=$(curl -s http://localhost:5000/api/queue/stats)
WAITING=$(echo $QUEUE_STATS | jq -r '.waiting')
ACTIVE=$(echo $QUEUE_STATS | jq -r '.active')

if [ "$WAITING" -eq "0" ] && [ "$ACTIVE" -eq "0" ]; then
    IDLE_COUNT_FILE="/tmp/idle_count"
    
    if [ -f "$IDLE_COUNT_FILE" ]; then
        IDLE_COUNT=$(cat $IDLE_COUNT_FILE)
        IDLE_COUNT=$((IDLE_COUNT + 1))
    else
        IDLE_COUNT=1
    fi
    
    echo $IDLE_COUNT > $IDLE_COUNT_FILE
    
    # Shutdown after 30 minutes of idle (6 checks × 5 min = 30 min)
    if [ "$IDLE_COUNT" -ge "6" ]; then
        echo "System idle for 30 minutes. Shutting down..."
        runpodctl stop pod
    fi
else
    rm -f /tmp/idle_count
fi
EOF

chmod +x /workspace/auto-shutdown.sh

# Add to crontab (check every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /workspace/auto-shutdown.sh") | crontab -
```

### Alternative: Time-Based Shutdown

```bash
# Shutdown at 6 PM daily
cat > /workspace/scheduled-shutdown.sh << 'EOF'
#!/bin/bash
runpodctl stop pod
EOF

chmod +x /workspace/scheduled-shutdown.sh

# Add to crontab (6 PM shutdown, start manually in morning)
(crontab -l 2>/dev/null; echo "0 18 * * * /workspace/scheduled-shutdown.sh") | crontab -
```

---

## Queue Stats Endpoint (Add to Backend)

```javascript
// backend/src/routes/queueRoutes.js
const express = require('express');
const router = express.Router();
const { getQueueStats } = require('../queues/callProcessingQueue');

router.get('/stats', async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Add to server.js
app.use('/api/queue', require('./routes/queueRoutes'));
```

---

## Cost Optimization Strategies

### 1. **Schedule-Based Operation** (Recommended)
```bash
# Start pod manually at 8 AM
# Auto-shutdown at 6 PM
# Cost: 10 hours × $0.261 × 30 days = $78.30/month
```

### 2. **Idle-Based Shutdown**
```bash
# Auto-shutdown after 30 minutes idle
# Auto-restart when new calls uploaded (via webhook)
# Cost: ~8-9 hours/day × $0.261 × 30 days = $62-70/month
```

### 3. **Aggressive Shutdown** (15 min idle)
```bash
# Shutdown after 15 minutes idle
# More frequent restarts but lower cost
# Cost: ~7-8 hours/day × $0.261 × 30 days = $55-62/month
```

---

## Monitoring & Alerts

### Add Monitoring Endpoint

```javascript
// backend/src/routes/healthRoutes.js
router.get('/metrics', async (req, res) => {
  const stats = await getQueueStats();
  const uptime = process.uptime();
  
  res.json({
    uptime: uptime,
    queue: stats,
    gpu: {
      available: process.env.DEVICE === 'cuda',
      utilization: 'Check nvidia-smi'
    },
    cost: {
      currentHour: 0.261,
      estimatedDaily: (uptime / 3600) * 0.261,
    }
  });
});
```

### GPU Monitoring

```bash
# Install gpustat
pip install gpustat

# Add to PM2
pm2 start gpustat --name gpu-monitor -- --watch -i 5

# Or create monitoring script
cat > /workspace/gpu-monitor.sh << 'EOF'
#!/bin/bash
while true; do
    nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader
    sleep 10
done
EOF
```

---

## Backup & Persistence

### Important Directories to Persist

```bash
# Models cache (persists in pod storage)
/root/.cache/huggingface/
/root/.cache/whisper/
/root/.cache/torch/

# Application data (on pod storage)
/workspace/AI_CALL_CENTER/
/workspace/uploads/
/workspace/logs/

# Database (external MongoDB Atlas - already persisted)
```

### Backup Configuration

```bash
# Backup script
cat > /workspace/backup.sh << 'EOF'
#!/bin/bash
cd /workspace
tar -czf backup-$(date +%Y%m%d).tar.gz \
    AI_CALL_CENTER/backend/.env \
    AI_CALL_CENTER/ai-service/.env \
    logs/ \
    --exclude='AI_CALL_CENTER/node_modules' \
    --exclude='AI_CALL_CENTER/ai-service/__pycache__'

# Upload to external storage (optional)
# aws s3 cp backup-$(date +%Y%m%d).tar.gz s3://your-bucket/
EOF

chmod +x /workspace/backup.sh

# Weekly backup
(crontab -l 2>/dev/null; echo "0 2 * * 0 /workspace/backup.sh") | crontab -
```

---

## Testing Deployment

```bash
# 1. Test AI Service
curl http://localhost:8000/health

# 2. Test GPU availability
curl http://localhost:8000/gpu-info

# 3. Test Backend API
curl http://localhost:5000/health

# 4. Test Redis
redis-cli ping

# 5. Test full pipeline (upload a sample call)
curl -X POST https://your-pod-id-5000.proxy.runpod.net/api/calls/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "audio=@sample.wav" \
  -F "agentId=AGT-001" \
  -F "agentName=Test Agent" \
  -F "campaign=TestCampaign" \
  -F "duration=300" \
  -F "callDate=2025-12-10" \
  -F "isTransferred=true"
```

---

## Estimated Monthly Costs

| Usage Pattern | Hours/Day | Days/Month | Running Cost | Stopped Cost | **Total** |
|---------------|-----------|------------|--------------|--------------|-----------|
| **8 hours** | 8 | 30 | $62.64 | $6.72 | **$69.36** ✅ |
| **10 hours** | 10 | 30 | $78.30 | $5.88 | **$84.18** ✅ |
| **12 hours** | 12 | 30 | $93.96 | $5.04 | **$99.00** ✅ |
| 24/7 | 24 | 30 | $187.92 | $0 | $187.92 ❌ |

---

## Quick Start Commands

```bash
# SSH into RunPod
runpodctl ssh your-pod-id

# Start all services
pm2 start all

# Stop all services
pm2 stop all

# Restart services
pm2 restart all

# View logs
pm2 logs

# Monitor resources
pm2 monit
htop
nvidia-smi -l 1

# Check costs
echo "Uptime: $(uptime -p)"
echo "Estimated cost: $(($(cat /proc/uptime | awk '{print int($1/3600)}') * 0.261))"
```

---

## Troubleshooting

### GPU Not Detected
```bash
nvidia-smi
# If error, reinstall CUDA drivers
apt-get install -y nvidia-driver-535
reboot
```

### Redis Connection Failed
```bash
systemctl status redis-server
systemctl restart redis-server
redis-cli ping
```

### AI Service Out of Memory
```bash
# Reduce concurrency
# In ai-service/.env
MAX_WORKERS=2  # Reduce from 3

# Or use smaller model
WHISPER_MODEL=base  # Instead of medium
```

### High Costs
```bash
# Check if auto-shutdown is working
crontab -l
cat /tmp/idle_count

# Force shutdown
runpodctl stop pod
```

---

## Summary

**Your RunPod Setup:**
- **Instance:** RTX A4500 (20GB VRAM, 54GB RAM, 12 vCPU)
- **Cost:** $69-84/month (8-10 hours/day operation)
- **Capacity:** 120-180 calls/hour (2-3x your needs)
- **Processing:** 15-25 seconds per call with full AI pipeline
- **Budget:** ✅ Well under $100/month

**Next Steps:**
1. Sign up for RunPod: https://runpod.io
2. Create pod with RTX A4500
3. Follow deployment steps above
4. Test with sample transferred calls
5. Set up auto-shutdown schedule
6. Monitor costs in RunPod dashboard

**Expected First Month Cost:** ~$70-85 including setup/testing
