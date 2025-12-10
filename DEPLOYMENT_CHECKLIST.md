# Deployment Checklist - Render + Vercel

## ✅ Pre-Deployment Checklist

### Code Changes (All Complete)
- [x] Backend CORS configured for production with `ALLOWED_ORIGINS` env var
- [x] Frontend API URL uses `VITE_API_URL` environment variable
- [x] AI Service CORS configured with environment variables
- [x] Queue stats endpoint added (`/api/queue/stats`)
- [x] Environment example files updated with Render deployment comments
- [x] `.env.production` created for Vercel
- [x] `.env.development` created for local testing
- [x] `.gitignore` updated to include deployment env files

### Files Created
- [x] `render.yaml` - Main Render deployment configuration
- [x] `vercel.json` - Vercel frontend configuration  
- [x] `RENDER_VERCEL_DEPLOYMENT.md` - Complete deployment guide
- [x] `QUICKSTART_RENDER.md` - Quick start guide
- [x] `backend/src/routes/queueRoutes.js` - Queue monitoring endpoints
- [x] `frontend/.env.production` - Production environment variables
- [x] `frontend/.env.development` - Development environment variables
- [x] `test-render-api.http` - API testing file
- [x] `RENDER_FILES_INFO.md` - Info about RunPod vs Render files

---

## 🚀 Deployment Steps

### Step 1: Commit and Push
```powershell
git add .
git commit -m "Configure for Render + Vercel deployment"
git push origin main
```

### Step 2: Deploy Backend on Render (10 minutes)

1. **Go to Render**: https://dashboard.render.com
2. **Click "New +"** → **"Blueprint"**
3. **Connect GitHub** → Select your repository
4. **Click "Apply"** - Creates 4 services:
   - ✅ Backend API (Web Service) - $7/mo
   - ✅ AI Service (Web Service) - $25/mo
   - ✅ Worker (Background Worker) - $7/mo
   - ✅ Redis (Redis Instance) - $7/mo

5. **Configure Secrets** (Important!):

   **Backend API Service** → Environment:
   ```
   MONGO_URI=mongodb+srv://Nextel:Nextel123@cluster0.9eph1nl.mongodb.net/AICallCenter
   ```

   **AI Service** → Environment:
   ```
   HF_TOKEN=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
   ```

   **Worker Service** → Environment:
   ```
   MONGO_URI=mongodb+srv://Nextel:Nextel123@cluster0.9eph1nl.mongodb.net/AICallCenter
   ```

6. **Wait for deployment** (~10-15 minutes for first deployment)

7. **Copy your backend URL**: `https://ai-callcenter-backend.onrender.com`

### Step 3: Deploy Frontend on Vercel (3 minutes)

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Click "Add New..."** → **"Project"**
3. **Import** your GitHub repository
4. **Configure**:
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Add Environment Variable**:
   ```
   VITE_API_URL=https://ai-callcenter-backend.onrender.com/api
   ```

6. **Click "Deploy"**

7. **Copy your Vercel URL**: `https://your-app.vercel.app`

### Step 4: Update CORS (Critical!)

1. **Go back to Render** → **AI Service** → **Environment**
2. **Add/Update**:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://ai-callcenter-backend.onrender.com
   ```
   *(Replace `your-app` with your actual Vercel subdomain)*

3. **Click "Manual Deploy"** → **"Deploy latest commit"**

### Step 5: Update Backend CORS (Optional)

If you want strict CORS on the backend too:

1. **Render** → **Backend API** → **Environment**
2. **Add**:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
3. **Redeploy**

---

## 🧪 Testing Your Deployment

### Test Backend Health
```bash
curl https://ai-callcenter-backend.onrender.com/api/health
```
**Expected**: `{"status":"healthy",...}`

### Test AI Service Health
```bash
curl https://ai-callcenter-ai-service.onrender.com/health
```
**Expected**: `{"status":"healthy",...}`

### Test Frontend
1. Open your Vercel URL: `https://your-app.vercel.app`
2. Register a new user
3. Login
4. Upload a test call with transfer checkbox enabled
5. Wait 2-5 minutes for processing
6. Check dashboard for results

### Test Queue Stats
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://ai-callcenter-backend.onrender.com/api/queue/stats
```
**Expected**: `{"success":true,"stats":{...}}`

---

## 📊 Monitor Your Deployment

### Render Dashboard
- **Logs**: Real-time logs for each service
- **Metrics**: CPU, Memory, Request count
- **Events**: Deployment history, crashes

### View Logs
1. Go to Render Dashboard
2. Select a service
3. Click "Logs" tab
4. See real-time output

### Common Issues

#### AI Service Crashes (Out of Memory)
**Cause**: Model too large for 2GB RAM

**Fix**: Verify `WHISPER_MODEL=base` in Render dashboard

#### Frontend Can't Connect
**Cause**: CORS error

**Fix**: 
1. Check browser console for exact error
2. Update `ALLOWED_ORIGINS` in AI Service
3. Ensure URLs match exactly (no trailing slashes)

#### Calls Not Processing
**Cause**: Worker not connected to Redis/MongoDB

**Fix**: 
1. Check worker logs in Render
2. Verify `REDIS_HOST` and `MONGO_URI` are set
3. Restart worker service

---

## 💰 Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| Backend API (Starter) | $7 |
| AI Service (Standard) | $25 |
| Worker (Starter) | $7 |
| Redis (Starter) | $7 |
| Vercel (Hobby) | $0 |
| **Total** | **$46/month** |

**Upgrade Options**:
- Backend to Standard ($25): Total = $64/mo
- Add 2 more workers ($14): Total = $60/mo
- Both upgrades: Total = $78/mo

✅ **All under your $100/month budget!**

---

## 🔄 Scaling for 400-500 Calls/Day

Current setup processes **~10-15 calls/hour**.

For **50-70 calls/hour** during 8-10 hour shifts:

### Option 1: Add More Workers
1. Render Dashboard → Duplicate Worker service
2. Name: `ai-callcenter-worker-2`
3. Update env: `WORKER_ID=render-worker-2`
4. Deploy

**Cost**: $7/worker × 3 workers = $21 extra = **$67/mo total**

### Option 2: Upgrade to Faster Processing
1. Upgrade Backend to Standard ($25)
2. Add 2 more workers ($14)
3. Use Whisper `tiny` model (faster, 90% accuracy)

**Cost**: $78/mo total

---

## 📚 Next Steps

1. ✅ Deploy and test
2. Set up monitoring (UptimeRobot for health checks)
3. Implement VicidiaL integration (see `TRANSFER_QA_STRATEGY.md`)
4. Add frontend transfer checkbox UI
5. Configure auto-scaling based on queue depth
6. Set up error alerting (Slack/email)

---

## 🆘 Support

**Render**: 
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
- Community: https://community.render.com

**Vercel**: 
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs

**Documentation**:
- Complete Guide: `RENDER_VERCEL_DEPLOYMENT.md`
- Quick Start: `QUICKSTART_RENDER.md`
- Transfer QA: `TRANSFER_QA_STRATEGY.md`

---

**You're ready to deploy! 🎉**
