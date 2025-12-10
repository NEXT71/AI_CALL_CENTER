# Render + Vercel Deployment Guide

Complete deployment guide for AI Call Center using **Render** (backend + AI service) and **Vercel** (frontend).

## 📊 Cost Breakdown

### Render Services (Backend Infrastructure)
| Service | Plan | Monthly Cost | Purpose |
|---------|------|--------------|---------|
| Backend API | Starter | $7 | Node.js API server |
| AI Service | Standard | $25 | Python FastAPI with AI models (2GB RAM) |
| Worker | Starter | $7 | Background job processor |
| Redis | Starter | $7 | Queue management |
| **Total** | | **$46/month** | |

**Upgrade Option**: Backend API to Standard ($25) for better performance = **$64/month total**

### Vercel (Frontend)
| Plan | Monthly Cost | Features |
|------|--------------|----------|
| Hobby (Free) | $0 | 100GB bandwidth, unlimited deployments |
| Pro | $20 | 1TB bandwidth, priority support |

### Total Monthly Cost
- **Minimum**: $46/month (Render) + $0 (Vercel Free) = **$46/month**
- **Recommended**: $64/month (Render upgraded) + $0 (Vercel Free) = **$64/month**
- **With Vercel Pro**: $64/month + $20 = **$84/month**

✅ **All options are under your $100/month budget!**

---

## 🚀 Deployment Steps

### Part 1: Render Deployment (Backend + AI Service)

#### Step 1: Prepare Repository
```bash
# Ensure render.yaml is in root directory
ls render.yaml

# Commit all changes
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

#### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repository

#### Step 3: Deploy from Blueprint (Automatic)
1. Click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Select the repository with `render.yaml`
4. Render will automatically create all 4 services:
   - `ai-callcenter-backend` (Web Service)
   - `ai-callcenter-ai-service` (Web Service)
   - `ai-callcenter-worker` (Background Worker)
   - `ai-callcenter-redis` (Redis Instance)

#### Step 4: Configure Environment Variables

##### Backend API (`ai-callcenter-backend`)
Go to service dashboard → Environment:
```bash
MONGO_URI=mongodb+srv://Nextel:Nextel123@cluster0.9eph1nl.mongodb.net/AICallCenter
```

##### AI Service (`ai-callcenter-ai-service`)
Go to service dashboard → Environment:
```bash
HF_TOKEN=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

# Update ALLOWED_ORIGINS after Vercel deployment:
ALLOWED_ORIGINS=https://your-app.vercel.app,https://ai-callcenter-backend.onrender.com
```

##### Worker (`ai-callcenter-worker`)
Go to service dashboard → Environment:
```bash
MONGO_URI=mongodb+srv://Nextel:Nextel123@cluster0.9eph1nl.mongodb.net/AICallCenter
```

#### Step 5: Wait for Build & Deployment
- Backend API: ~3-5 minutes
- AI Service: ~8-12 minutes (downloads AI models)
- Worker: ~3-5 minutes
- Redis: ~1-2 minutes

#### Step 6: Verify Services
```bash
# Test Backend API Health
curl https://ai-callcenter-backend.onrender.com/api/health

# Test AI Service Health
curl https://ai-callcenter-ai-service.onrender.com/health

# Expected Response:
{
  "status": "healthy",
  "timestamp": "2025-12-10T...",
  "uptime": 123.45,
  ...
}
```

---

### Part 2: Vercel Deployment (Frontend)

#### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access repositories

#### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### Step 3: Configure Environment Variables
In Vercel project settings → Environment Variables:
```bash
VITE_API_URL=https://ai-callcenter-backend.onrender.com/api
```

#### Step 4: Deploy
1. Click **"Deploy"**
2. Wait ~2-3 minutes for build
3. You'll get a URL like: `https://your-app.vercel.app`

#### Step 5: Update Backend CORS
Go back to Render → AI Service → Environment:
```bash
# Update with your actual Vercel URL:
ALLOWED_ORIGINS=https://your-app.vercel.app,https://ai-callcenter-backend.onrender.com
```

Redeploy AI service after updating CORS.

---

## 🔧 Configuration Updates Needed

### Update Frontend API URL
Create/update `frontend/.env.production`:
```bash
VITE_API_URL=https://ai-callcenter-backend.onrender.com/api
```

### Update Backend CORS (already configured)
The `backend/src/server.js` already uses `process.env.ALLOWED_ORIGINS` or defaults to allow all in production.

---

## 📋 Post-Deployment Checklist

### Backend API Testing
- [ ] Health check: `GET /api/health`
- [ ] Register user: `POST /api/auth/register`
- [ ] Login: `POST /api/auth/login`
- [ ] Upload call (with transfer): `POST /api/calls/upload`

### AI Service Testing
- [ ] Health check: `GET /health`
- [ ] Process call: `POST /process` (test with audio file)

### Frontend Testing
- [ ] Login page loads
- [ ] Authentication works
- [ ] Dashboard displays
- [ ] Call upload works
- [ ] Transfer checkbox visible

### Queue Testing
```bash
# Check queue stats via backend API
curl https://ai-callcenter-backend.onrender.com/api/queue/stats

# Expected: { waiting: 0, active: 0, completed: X, failed: Y }
```

---

## ⚠️ Important Render Limitations

### 1. AI Model Size Constraints
**Issue**: Render Standard plan has 2GB RAM, but Whisper `medium` model needs ~3GB

**Solution**: Use Whisper `base` model instead
```bash
# In ai-service/.env or Render dashboard:
WHISPER_MODEL=base  # Change from 'medium'
```

**Trade-off**: Slightly lower transcription accuracy (still 95%+ for English)

### 2. No GPU Available
**Issue**: Render doesn't provide GPU on standard plans, processing will be CPU-only

**Expected Performance**:
- With CPU: ~2-5 minutes per call
- Processing capacity: ~10-15 calls/hour per worker

**For 150 sale calls/day** (~15-20/hour during 8-10 hour shift):
- You'll need **2 workers** running concurrently
- Cost: 2 workers × $7/month = **$14/month** (total becomes $60/month)

**To add more workers**:
1. Go to Render dashboard
2. Duplicate the worker service
3. Change `WORKER_ID` to `render-worker-2`, `render-worker-3`, etc.

### 3. Cold Starts
**Issue**: Free/Starter plans spin down after 15 minutes of inactivity

**Impact**:
- First request after idle: 30-60 second delay
- Subsequent requests: normal speed

**Solution**: Upgrade to paid plans (already in config) or use a cron job to ping services every 10 minutes

---

## 🔄 Alternative: Manual Render Deployment

If `render.yaml` blueprint doesn't work, deploy manually:

### Create Backend API Service
1. New Web Service → Connect GitHub repo
2. Settings:
   - **Name**: `ai-callcenter-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/mo)
   - Add environment variables (see Step 4 above)

### Create AI Service
1. New Web Service → Connect GitHub repo
2. Settings:
   - **Name**: `ai-callcenter-ai-service`
   - **Root Directory**: `ai-service`
   - **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Standard ($25/mo)
   - Add Disk: 5GB at `/opt/render/.cache`
   - Add environment variables

### Create Worker
1. New Background Worker → Connect GitHub repo
2. Settings:
   - **Name**: `ai-callcenter-worker`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run worker`
   - **Plan**: Starter ($7/mo)
   - Add environment variables

### Create Redis
1. New Redis → Region: Oregon
2. Settings:
   - **Name**: `ai-callcenter-redis`
   - **Plan**: Starter ($7/mo)

---

## 📊 Monitoring & Logs

### Render Dashboard
- **Metrics**: CPU, Memory, Request count
- **Logs**: Real-time streaming logs for each service
- **Events**: Deployment history, crashes, restarts

### View Logs
```bash
# Install Render CLI (optional)
npm install -g @render-com/cli

# View backend logs
render logs ai-callcenter-backend

# View AI service logs
render logs ai-callcenter-ai-service

# View worker logs
render logs ai-callcenter-worker
```

### Health Monitoring
Set up external monitoring (UptimeRobot, Pingdom) to ping:
- `https://ai-callcenter-backend.onrender.com/api/health`
- `https://ai-callcenter-ai-service.onrender.com/health`

---

## 🚨 Troubleshooting

### Issue: AI Service Crashes (Out of Memory)
**Cause**: Whisper `medium` model too large for 2GB RAM

**Fix**: Change to `base` model in Render dashboard:
```bash
WHISPER_MODEL=base
```
Then click "Manual Deploy" → "Clear build cache & deploy"

### Issue: Backend Can't Connect to Redis
**Cause**: Environment variables not linked

**Fix**: 
1. Go to Backend service → Environment
2. Ensure `REDIS_HOST` and `REDIS_PORT` are linked to Redis service
3. Redeploy backend

### Issue: Frontend Shows "Network Error"
**Cause**: CORS blocking requests

**Fix**:
1. Check browser console for exact error
2. Update `ALLOWED_ORIGINS` in AI Service to include your Vercel URL
3. Ensure `VITE_API_URL` in Vercel matches your Render backend URL

### Issue: Calls Not Processing
**Cause**: Worker not running or queue connection failed

**Fix**:
```bash
# Check worker logs in Render dashboard
# Ensure Redis is connected
# Verify MONGO_URI and REDIS_HOST are set correctly
```

---

## 🎯 Performance Optimization

### 1. Upgrade Backend API to Standard
- **Cost**: $25/month (instead of $7)
- **Benefit**: 2x faster API responses, handle more concurrent requests

### 2. Add More Workers
For 400-500 calls/day:
- **Current**: 1 worker = ~10-15 calls/hour
- **Recommended**: 3-5 workers = ~30-75 calls/hour
- **Cost**: $7/month per worker

### 3. Use Whisper `tiny` Model (Faster)
If accuracy allows:
```bash
WHISPER_MODEL=tiny  # Fastest, ~90% accuracy
```

### 4. Enable Redis Persistence
Upgrade Redis plan to preserve queue data across restarts.

---

## 💰 Cost Scaling Scenarios (150 Calls/Day)

### Scenario 1: Minimal (Current Config) ✅ RECOMMENDED
- Backend: $7
- AI Service: $25
- Worker (1x): $7
- Redis: $7
- **Total: $46/month**
- **Capacity**: ~10-15 calls/hour = **120-180 calls/day**
- **Sufficient for 150 calls/day**

### Scenario 2: Fast Processing (2 Workers)
- Backend: $7
- AI Service: $25
- Workers (2x): $14
- Redis: $7
- **Total: $53/month**
- **Capacity**: ~20-30 calls/hour = **200-300 calls/day**
- **Faster processing, more headroom**

### Scenario 3: Premium (Upgraded Backend)
- Backend Standard: $25
- AI Service: $25
- Workers (2x): $14
- Redis: $7
- **Total: $71/month**
- **Capacity**: ~25-35 calls/hour with better API performance

✅ **All scenarios well under your $100/month budget**
✅ **Scenario 1 ($46/mo) handles 150 calls/day comfortably**

---

## 🔐 Security Best Practices

### Environment Variables
- ✅ Never commit `.env` files
- ✅ Use Render's secret management
- ✅ Rotate JWT secrets periodically

### CORS Configuration
```bash
# Strict CORS in production:
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### MongoDB Atlas
- ✅ Whitelist Render IP addresses
- ✅ Use strong passwords
- ✅ Enable audit logs

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Redis on Render](https://render.com/docs/redis)
- [Node.js Deployment](https://render.com/docs/deploy-node-express-app)
- [Python Deployment](https://render.com/docs/deploy-fastapi)

---

## 🆘 Support

### Render Support
- Dashboard: https://dashboard.render.com
- Community: https://community.render.com
- Status: https://status.render.com

### Vercel Support
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord

---

## ✅ Next Steps After Deployment

1. **Test transfer-only QA workflow**:
   - Upload a call with `isTransferred: true`
   - Verify it gets queued for processing
   - Check AI analysis results

2. **Implement VicidiaL integration** (optional):
   - Use code from `TRANSFER_QA_STRATEGY.md`
   - Sync transferred calls from VicidiaL database

3. **Set up monitoring**:
   - Configure UptimeRobot for health checks
   - Set up Slack/email alerts for failures

4. **Add auto-scaling** (if needed):
   - Configure Render to auto-scale workers based on queue depth

5. **Enable backups**:
   - MongoDB Atlas: Configure automated backups
   - Render: Regular database snapshots

---

**Deployment Complete!** 🎉

Your AI Call Center is now running on professional cloud infrastructure for **$46-100/month**.
