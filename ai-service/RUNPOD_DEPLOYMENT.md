# RunPod Deployment Guide - AI Call Center Service

## 🚀 Quick Start

### Option 1: RunPod Serverless (Recommended - Auto-scaling)

**Cost:** ~$0.0004/second GPU time (~$10-50/month for moderate usage)

1. **Build and Push Docker Image**
   ```bash
   cd ai-service
   
   # Build the image
   docker build -t your-dockerhub-username/ai-callcenter-service:latest .
   
   # Login to Docker Hub
   docker login
   
   # Push to Docker Hub
   docker push your-dockerhub-username/ai-callcenter-service:latest
   ```

2. **Deploy to RunPod Serverless**
   - Go to https://runpod.io/console/serverless
   - Click "New Endpoint"
   - Configure:
     - **Name:** ai-callcenter-service
     - **Docker Image:** `your-dockerhub-username/ai-callcenter-service:latest`
     - **GPU Type:** NVIDIA RTX A4000 (16GB) or RTX 4090 (24GB)
     - **Container Disk:** 50 GB
     - **Environment Variables:**
       ```
       WHISPER_MODEL=medium
       DEVICE=cuda
       ALLOWED_ORIGINS=https://your-frontend-domain.com
       ```
     - **Active Workers:** 0-3 (auto-scales)
     - **Max Workers:** 5
     - **Idle Timeout:** 5 minutes
   
3. **Get Your Endpoint URL**
   - After deployment: `https://api.runpod.ai/v2/YOUR_ENDPOINT_ID`
   - Test endpoint: `https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/health`

4. **Update Backend .env**
   ```env
   AI_SERVICE_URL=https://api.runpod.ai/v2/YOUR_ENDPOINT_ID
   RUNPOD_API_KEY=your_api_key_here
   ```

### Option 2: RunPod GPU Pods (Always-On)

**Cost:** ~$0.20-0.40/hour ($150-300/month)

1. **Create a Pod**
   - Go to https://runpod.io/console/pods
   - Click "Deploy"
   - Select GPU: RTX A4000 or RTX 4090
   - Select Template: "PyTorch 2.1"
   - Volume: 50GB
   - Ports: Expose 8000 as HTTP

2. **SSH into Pod and Deploy**
   ```bash
   # SSH into pod (get SSH command from RunPod dashboard)
   ssh root@YOUR_POD_IP -p YOUR_POD_PORT -i ~/.ssh/id_ed25519
   
   # Clone your repository
   git clone https://github.com/your-username/AI_CALL_CENTER.git
   cd AI_CALL_CENTER/ai-service
   
   # Install dependencies
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   
   # Run the service
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. **Get Your Pod URL**
   - Pod URL: `https://YOUR_POD_ID-8000.proxy.runpod.net`

4. **Update Backend .env**
   ```env
   AI_SERVICE_URL=https://YOUR_POD_ID-8000.proxy.runpod.net
   ```

## 📊 Performance Comparison

| Model | CPU (Render) | GPU (RunPod A4000) | GPU (RunPod 4090) |
|-------|--------------|--------------------|--------------------|
| Whisper Medium (5 min audio) | 2-5 minutes | 15-30 seconds | 8-15 seconds |
| Sentiment Analysis | 0.5-1 second | 0.1-0.2 seconds | 0.05-0.1 seconds |
| Entity Extraction | 1-2 seconds | 0.2-0.5 seconds | 0.1-0.3 seconds |
| Summarization | 3-5 seconds | 0.5-1 second | 0.3-0.7 seconds |

**GPU gives you 10-20x faster processing!**

## 💰 Cost Estimation

### Serverless (Recommended)
- 100 calls/day, 5 min avg duration
- Processing time: ~30 seconds/call on GPU
- Monthly cost: 100 calls × 30 days × 30 sec × $0.0004 = **~$36/month**
- Plus cold start overhead: **~$40-50/month total**

### Always-On Pod
- RTX A4000: ~$0.24/hour = **~$175/month**
- RTX 4090: ~$0.39/hour = **~$285/month**
- No cold starts, instant response

**For your use case: Serverless is cost-effective unless you need zero cold starts.**

## 🔧 Environment Variables

```env
# AI Model Configuration
WHISPER_MODEL=medium           # Options: tiny, base, small, medium, large
DEVICE=cuda                     # Use 'cuda' for GPU
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
SPACY_MODEL=en_core_web_sm
SUMMARIZATION_MODEL=facebook/bart-large-cnn

# CORS (match your frontend domain)
ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com
```

## 🧪 Testing Your Deployment

```bash
# Health check
curl https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/health

# Test transcription
curl -X POST https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audio_path": "/path/to/audio.wav"}'

# Test sentiment analysis
curl -X POST https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/analyze-sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "This call was excellent!"}'
```

## 🔒 Security Best Practices

1. **Use API Keys**: Add API key authentication to main.py
2. **CORS**: Set ALLOWED_ORIGINS to your actual frontend domains
3. **File Upload Validation**: Already implemented in backend
4. **Rate Limiting**: Consider adding rate limits to RunPod endpoint
5. **Private Images**: Use private Docker registry for production

## 🚨 Cold Start Mitigation (Serverless)

Cold start typically takes 5-15 seconds. To minimize impact:

1. **Keep-Alive Ping**: Send a health check every 4 minutes
   ```javascript
   // In your backend
   setInterval(() => {
     axios.get(`${AI_SERVICE_URL}/health`).catch(() => {});
   }, 4 * 60 * 1000); // Every 4 minutes
   ```

2. **Minimum Active Workers**: Set to 1 for peak hours
3. **Upgrade to Pod**: If cold starts are unacceptable

## 📈 Scaling Strategy

**Phase 1: Development**
- Local: `AI_SERVICE_URL=http://localhost:8000`
- Cost: $0

**Phase 2: Launch (0-100 calls/day)**
- RunPod Serverless (0 min workers)
- Cost: ~$20-40/month

**Phase 3: Growth (100-500 calls/day)**
- RunPod Serverless (1 min worker)
- Cost: ~$200-250/month

**Phase 4: Scale (500+ calls/day)**
- RunPod Serverless (2-3 min workers) or
- Switch to dedicated GPU Pod
- Cost: ~$300-500/month

## 🛠️ Troubleshooting

**Issue:** "Model not found" error
- **Solution:** Ensure spaCy model is downloaded: `python -m spacy download en_core_web_sm`

**Issue:** CUDA out of memory
- **Solution:** Reduce WHISPER_MODEL to 'small' or upgrade GPU

**Issue:** Cold starts too long
- **Solution:** Use smaller Whisper model or switch to always-on Pod

**Issue:** Audio file not found
- **Solution:** Ensure audio files are accessible in container (mount volume or use URLs)

## ⏰ **Cost Optimization - Scheduled Pod Management**

**Problem:** GPU Pods run 24/7 but you only need them during business hours.

**Solution:** Use automated pod scheduling to save ~80% on costs!

### **Setup Automated Scheduler**
1. **Get API Access**: Generate RunPod API key in account settings
2. **Configure Environment**:
   ```env
   RUNPOD_API_KEY=your_api_key_here
   RUNPOD_POD_ID=your_pod_id_here
   ```
3. **Run Scheduler**: `python runpod_scheduler.py`

### **Cost Savings**
- **Before**: 24/7 = ~$180/month (RTX A4500)
- **After**: Scheduled = ~$36/month (Mon-Sat, 6:45 PM PKT - 6:00 AM PST)
- **Savings**: **$144/month (80% reduction!)**

See `RUNPOD_SCHEDULER_README.md` for detailed setup instructions.

## 📝 Next Steps

1. ✅ Build and push Docker image
2. ✅ Create RunPod Serverless endpoint
3. ✅ Update backend/.env with endpoint URL
4. ✅ Test with sample audio file
5. ✅ Monitor logs and performance
6. ✅ Set up keep-alive ping (optional)
7. ✅ Configure auto-scaling based on usage
8. ✅ **Set up pod scheduler for cost optimization**
