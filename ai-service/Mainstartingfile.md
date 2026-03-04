### 1. Clone Repository
```bash
git clone https://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@github.com/NEXT71/AI_CALL_CENTER.git
cd AI_CALL_CENTER/ai-service
```

### 2. Create .env Configuration File (Optional)
```bash
cat > .env << 'EOF'
# GPU Configuration
DEVICE=cuda
WHISPER_MODEL=base
MAX_WORKERS=4

# Model Configuration
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
SUMMARIZATION_MODEL=facebook/bart-large-cnn
SPACY_MODEL=en_core_web_sm

# HuggingFace Token (Required for pyannote.audio)
HUGGINGFACE_TOKEN=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
EOF
```

**Note:** RunPod Serverless doesn't need PORT/HOST/ALLOWED_ORIGINS configuration.

### 3. Install System Dependencies
```bash
apt-get update && apt-get install -y ffmpeg
```

### 4. Install PyTorch (CUDA 12.1 Compatible Version)
```bash
pip install torch==2.4.1 torchaudio==2.4.1 --index-url https://download.pytorch.org/whl/cu121
```

### 5. Install Python Dependencies
```bash
# CRITICAL: Install NumPy 1.x for pyannote.audio compatibility
pip install "numpy<2.0,>=1.26.4"

# Install all dependencies from requirements.txt
pip install -r requirements.txt
```

### 6. Download Spacy Model
```bash
python -m spacy download en_core_web_sm
```

### 7. Verify Installation & Configuration
```bash
# Verify NumPy version (MUST be <2.0)
python -c "import numpy; print(f'NumPy: {numpy.__version__}')"

# Verify PyTorch CUDA
python -c "import torch; print(f'CUDA Available: {torch.cuda.is_available()}')"

# Test RunPod handler import
python -c "import runpod; import main; print('✓ All imports successful')"
```

### 8. Deploy to RunPod Serverless

#### **RECOMMENDED: RunPod Serverless Deployment**

**Step 1: Create RunPod Serverless Endpoint**

1. Log into [RunPod Console](https://www.runpod.io/console/serverless)
2. Click **"Create Endpoint"**
3. Configure:
   - **Name:** `ai-call-center-qa`
   - **Template:** Python 3.10 + CUDA 12.1
   - **GPU:** NVIDIA RTX 2000 Ada (8GB VRAM minimum)
   - **Scaling:** 
     - Min Workers: 0 (scale to zero when idle)
     - Max Workers: 3
     - Idle Timeout: 5 seconds
   - **Request Timeout:** 600 seconds (10 min for long calls)

**Step 2: Deploy Code to RunPod**

```bash
# Create deployment package
tar -czf ai-service.tar.gz main.py requirements.txt

# Upload via RunPod Dashboard or CLI
# Dashboard: Endpoint Settings → "Upload Code" → Select ai-service.tar.gz
```

**Step 3: Set Environment Variables in RunPod**

In RunPod Endpoint Settings → Environment Variables, add:

```bash
DEVICE=cuda
WHISPER_MODEL=base
MAX_WORKERS=4
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
SUMMARIZATION_MODEL=facebook/bart-large-cnn
SPACY_MODEL=en_core_web_sm
HUGGINGFACE_TOKEN=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
```

**Step 4: Get RunPod API Credentials**

1. Copy **Endpoint ID** from RunPod dashboard (format: `xxxxx-xxxxx-xxxxx`)
2. Generate **API Key**: Settings → API Keys → Create API Key
3. Construct endpoint URL: `https://api.runpod.ai/v2/{ENDPOINT_ID}/run`

**Step 5: Configure Backend Service**

Add to backend `.env` file:

```bash
USE_RUNPOD_SERVERLESS=true
RUNPOD_SERVERLESS_ENDPOINT=https://api.runpod.ai/v2/{YOUR_ENDPOINT_ID}/run
RUNPOD_API_KEY=your_api_key_here
BASE_URL=https://your-backend.onrender.com
```

---

### 9. Test RunPod Deployment

**Step 1: Test via RunPod Console**

1. Go to RunPod Endpoint page
2. Click **"Test"** tab
3. Send test request:

```json
{
  "input": {
    "audio_url": "https://your-backend.onrender.com/temp-audio/test.wav",
    "call_id": "test_call_123",
    "webhook_url": "https://your-backend.onrender.com/api/webhooks/runpod"
  }
}
```

4. Check response:
   - Status: `COMPLETED`
   - Output should contain: `transcript`, `sentiment`, `quality_score`, etc.

**Step 2: Test End-to-End from Frontend**

1. Log into your application
2. Upload a test call audio file
3. Mark as sale/no-sale
4. Check backend logs for:
   ```
   ✓ Audio saved to /temp-audio/
   ✓ RunPod job submitted: job_id
   ✓ Webhook received from RunPod
   ✓ Audio file deleted
   ```
5. Verify results appear in dashboard

---

### 10. Local Testing (Optional)

If you want to test the handler locally before deploying:

```bash
# Install RunPod SDK
pip install runpod

# Test handler function
python3 << 'PYEOF'
import main
import json

# Simulate RunPod job
test_job = {
    "input": {
        "audio_url": "https://your-backend.onrender.com/temp-audio/test.wav",
        "call_id": "local_test_123",
        "webhook_url": "http://localhost:3000/api/webhooks/runpod"
    }
}

result = main.handler(test_job)
print(json.dumps(result, indent=2))
PYEOF
```

---

### 11. Monitoring & Troubleshooting

**RunPod Dashboard Metrics:**
- Active Workers (should scale 0-3)
- Request Queue Size
- Average Execution Time
- GPU Utilization
- Error Rate

**Backend Logs to Monitor:**
```bash
# Check RunPod API calls
grep "RunPod job submitted" /var/log/app.log

# Check webhook receipts
grep "RunPod webhook received" /var/log/app.log

# Check audio cleanup
grep "Deleted temp audio" /var/log/app.log
```

**Common Issues:**

1. **Timeout errors (>600s)**: Use smaller Whisper model (`tiny` instead of `base`)
2. **CUDA OOM**: Reduce MAX_WORKERS in RunPod environment variables
3. **Webhook not received**: Check BASE_URL and webhook firewall rules
4. **Audio download fails**: Verify /temp-audio endpoint has CORS enabled

---

### 12. RunPod Serverless Advantages

✅ **Cost Savings:** Only pay for actual processing time (not idle hours)  
✅ **Auto-Scaling:** Scales 0→3 workers based on demand  
✅ **No Server Management:** RunPod handles crashes, restarts, monitoring  
✅ **GPU Pooling:** Shares GPU resources across multiple endpoints  
✅ **Built-in Monitoring:** Dashboard with metrics, logs, error tracking  
✅ **Automatic Cleanup:** Container destroyed after each request (prevents memory leaks)  
✅ **Global CDN:** Low-latency endpoints worldwide  
✅ **Version Control:** Easy rollback to previous deployments

---

### 13. Production Checklist

✅ RunPod endpoint deployed with correct GPU type  
✅ Environment variables set in RunPod dashboard  
✅ Backend `.env` has USE_RUNPOD_SERVERLESS=true  
✅ Webhook endpoint publicly accessible  
✅ /temp-audio endpoint serves files with correct CORS headers  
✅ Test end-to-end: upload → process → webhook → cleanup  
✅ Monitor RunPod dashboard for errors  
✅ Set up alerts for high error rate (>5%)  
✅ Backend logs show audio files being deleted after webhook  
✅ Stripe Growth plan created ($199/month, 2500 minutes)