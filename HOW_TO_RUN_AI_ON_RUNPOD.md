e have to change# How to Run AI Service on RunPod - Step by Step Guide

## 🚀 Complete Setup Guide

### Step 1: Create RunPod Account & Deploy Pod

1. **Go to RunPod**: https://runpod.io
2. **Sign up** and add payment method
3. **Add credit**: Minimum $10
4. **Click "Deploy"** → **"GPU Pods"**
5. **Select GPU**: RTX A4500 (20GB VRAM)
6. **Select Template**: RunPod PyTorch 2.1.0
7. **Configure**:
   - Container Disk: **80 GB**
   - Expose HTTP Ports: **8000, 5000, 6379**
   - Volume: Not needed (optional)
8. **Click "Deploy"**

Wait 2-3 minutes for pod to start.

---

### Step 2: Connect to Your Pod

#### Option A: Web Terminal (Easiest)
1. In RunPod dashboard, click your pod
2. Click **"Connect"** → **"Start Web Terminal"**
3. You'll see a terminal in your browser

#### Option B: SSH (Recommended)
```powershell
# Install RunPod CLI (one-time)
pip install runpod

# Login
runpodctl config

# SSH into pod
runpodctl ssh <your-pod-id>
```

---

### Step 3: Clone Your Repository

```bash
# Navigate to workspace
cd /workspace

# Clone your repository
git clone https://github.com/YOUR_USERNAME/AI_CALL_CENTER.git

# Enter directory
cd AI_CALL_CENTER

# Verify files exist
ls -la
# You should see: backend/, ai-service/, frontend/, etc.
```

---

### Step 4: Install System Dependencies

```bash
# Update package manager
apt-get update

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Redis
apt-get install -y redis-server

# Install other dependencies
apt-get install -y git ffmpeg libsndfile1 jq htop

# Install PM2 (process manager)
npm install -g pm2

# Verify installations
node --version    # Should show v20.x.x
python --version  # Should show Python 3.10.x
nvidia-smi        # Should show RTX A4500
redis-cli --version
```

---

### Step 5: Configure AI Service Environment

```bash
# Navigate to AI service
cd /workspace/AI_CALL_CENTER/ai-service

# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

**Set these values in `.env`:**
```bash
# Server
PORT=8000
HOST=0.0.0.0

# CORS - Allow all for now, restrict later
ALLOWED_ORIGINS=*

# Models - Use GPU
WHISPER_MODEL=medium
DEVICE=cuda

# Performance
MAX_WORKERS=3

# HuggingFace Token
HF_TOKEN=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

# Models
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
SPACY_MODEL=en_core_web_sm
SUMMARIZATION_MODEL=facebook/bart-large-cnn
```

**Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

---

### Step 6: Install Python Dependencies

```bash
# Still in /workspace/AI_CALL_CENTER/ai-service

# Install Python packages
pip install -r requirements.txt

# Download spaCy language model
python -m spacy download en_core_web_sm

# This takes 5-10 minutes
# Models will be downloaded on first run:
# - Whisper medium (~1.5GB)
# - DistilBERT (~260MB)
# - BART (~1.6GB)
```

---

### Step 7: Test AI Service

```bash
# Start AI service manually (test)
python main.py

# You should see:
# INFO:     Started server process
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Test in another terminal:**
```bash
# Open new terminal (or use web terminal's split view)
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","gpu_available":true,"device":"cuda","models_loaded":true}
```

**Press `Ctrl+C` to stop** (we'll use PM2 next)

---

### Step 8: Configure Backend & Worker

```bash
# Navigate to backend
cd /workspace/AI_CALL_CENTER/backend

# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

**Set these values in backend `.env`:**
```bash
# Server
PORT=5000
NODE_ENV=production

# MongoDB Atlas
MONGO_URI=mongodb+srv://Nextel:Nextel123@cluster0.9eph1nl.mongodb.net/AICallCenter

# JWT Secrets (generate random strings)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# AI Service (localhost - same pod)
AI_SERVICE_URL=http://localhost:8000

# Uploads
UPLOAD_DIR=/workspace/AI_CALL_CENTER/backend/uploads/calls
MAX_FILE_SIZE=52428800

# Redis (localhost - same pod)
REDIS_HOST=localhost
REDIS_PORT=6379

# Worker
WORKER_CONCURRENCY=3
WORKER_ID=runpod-worker-1

# Logging
LOG_LEVEL=info
LOG_DIR=/workspace/logs
FILE_RETENTION_DAYS=30
```

**Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

---

### Step 9: Install Backend Dependencies

```bash
# Still in /workspace/AI_CALL_CENTER/backend

# Install Node.js packages
npm install

# This takes 2-3 minutes
```

---

### Step 10: Start All Services with PM2

```bash
# Navigate to project root
cd /workspace/AI_CALL_CENTER

# Start Redis
redis-server --daemonize yes

# Verify Redis is running
redis-cli ping
# Should return: PONG

# Start services with PM2
pm2 start ecosystem.config.json

# Check status
pm2 status

# You should see:
# ┌─────┬──────────────┬─────────┬─────────┐
# │ id  │ name         │ status  │ restart │
# ├─────┼──────────────┼─────────┼─────────┤
# │ 0   │ ai-service   │ online  │ 0       │
# │ 1   │ backend-api  │ online  │ 0       │
# │ 2   │ call-worker  │ online  │ 0       │
# └─────┴──────────────┴─────────┴─────────┘

# View logs
pm2 logs

# Save PM2 configuration
pm2 save
```

---

### Step 11: Get RunPod Proxy URLs

```bash
# In RunPod dashboard, find your pod
# Click "Connect" → You'll see:

# HTTP Service [Port 8000]
# https://xxxxx-8000.proxy.runpod.net  ← AI Service URL

# HTTP Service [Port 5000]
# https://xxxxx-5000.proxy.runpod.net  ← Backend API URL
```

**Copy these URLs!**

---

### Step 12: Test Services

```bash
# Test AI Service Health (from RunPod terminal)
curl http://localhost:8000/health

# Test Backend Health
curl http://localhost:5000/api/health

# Test from outside (use your RunPod proxy URLs)
curl https://xxxxx-8000.proxy.runpod.net/health
curl https://xxxxx-5000.proxy.runpod.net/api/health
```

---

### Step 13: Update Frontend (Vercel)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**
3. **Settings** → **Environment Variables**
4. **Update `VITE_API_URL`**:
   ```
   VITE_API_URL=https://xxxxx-5000.proxy.runpod.net/api
   ```
5. **Redeploy** frontend

---

### Step 14: Update CORS

```bash
# Back in RunPod terminal
cd /workspace/AI_CALL_CENTER/ai-service

# Edit .env
nano .env

# Update ALLOWED_ORIGINS with your Vercel URL
ALLOWED_ORIGINS=https://your-app.vercel.app,https://xxxxx-5000.proxy.runpod.net

# Save and exit

# Restart AI service
pm2 restart ai-service
```

---

## ✅ Verification Checklist

Run these commands to verify everything is working:

```bash
# 1. Check PM2 processes
pm2 status
# All should be "online"

# 2. Check Redis
redis-cli ping
# Should return: PONG

# 3. Check GPU
nvidia-smi
# Should show RTX A4500 with CUDA processes

# 4. Check AI Service
curl http://localhost:8000/health
# Should return: {"status":"healthy","gpu_available":true}

# 5. Check Backend
curl http://localhost:5000/api/health
# Should return: {"status":"healthy","database":"connected"}

# 6. Check logs
pm2 logs --lines 50
# Should show no errors

# 7. Monitor in real-time
pm2 monit
# Shows CPU, memory usage live
```

---

## 🔄 Common PM2 Commands

```bash
# View all processes
pm2 status

# View logs (all services)
pm2 logs

# View logs (specific service)
pm2 logs ai-service
pm2 logs backend-api
pm2 logs call-worker

# Restart a service
pm2 restart ai-service

# Restart all
pm2 restart all

# Stop a service
pm2 stop ai-service

# Stop all
pm2 stop all

# Delete a service
pm2 delete ai-service

# Monitor (live dashboard)
pm2 monit

# Save current configuration
pm2 save

# Resurrect saved configuration
pm2 resurrect
```

---

## 💰 Cost Saving: Stop Pod When Not in Use

```bash
# Before stopping pod, save PM2 state
pm2 save

# In RunPod dashboard:
# Click pod → Click "Stop"
# Cost drops from $0.261/hr to $0.014/hr

# When you restart pod:
pm2 resurrect  # Restores all services
```

---

## 🔧 Troubleshooting

### AI Service won't start
```bash
# Check Python version
python --version  # Should be 3.10+

# Check CUDA
nvidia-smi  # Should show GPU

# Check logs
pm2 logs ai-service --lines 100

# Reinstall dependencies
cd /workspace/AI_CALL_CENTER/ai-service
pip install -r requirements.txt --force-reinstall
```

### Worker can't connect to Redis
```bash
# Check Redis is running
redis-cli ping

# If not running:
redis-server --daemonize yes

# Check backend .env
nano /workspace/AI_CALL_CENTER/backend/.env
# Verify: REDIS_HOST=localhost, REDIS_PORT=6379
```

### Out of memory
```bash
# Check memory usage
free -h

# Reduce worker concurrency
nano /workspace/AI_CALL_CENTER/backend/.env
# Change: WORKER_CONCURRENCY=2 (instead of 3)

# Use smaller Whisper model
nano /workspace/AI_CALL_CENTER/ai-service/.env
# Change: WHISPER_MODEL=base (instead of medium)

# Restart services
pm2 restart all
```

---

## 📊 Monitor GPU Usage

```bash
# Watch GPU in real-time
watch -n 1 nvidia-smi

# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"
# Should print: True
```

---

## 🎉 You're Done!

Your AI service is now running on RunPod with GPU acceleration!

**Test the full flow:**
1. Upload a call via frontend (Vercel)
2. Check PM2 logs: `pm2 logs call-worker`
3. Watch GPU usage: `nvidia-smi`
4. Check results in frontend after 15-25 seconds

**Monthly cost**: $69-84 (8-10 hours/day)
**Processing speed**: 15-25 seconds per call with GPU
