
+
# Render + Vercel Deployment - Start Here!

## 🎯 Your Deployment Plan (150 Calls/Day)

**Monthly Cost:** $46
**Setup Time:** ~15 minutes
**Processing Speed:** 2-5 minutes per call
**Capacity:** 120-180 calls/day (perfect for your 150 calls)

---

## ✅ Pre-Deployment Checklist

Before you start, make sure you have:
- [ ] GitHub account with your repository
- [ ] MongoDB Atlas connection string (already have: `mongodb+srv://Nextel:Nextel123@cluster0.9eph1nl.mongodb.net/AICallCenter`)
- [ ] HuggingFace token (already have: `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`)
- [ ] Render account (sign up at https://render.com if needed)
- [ ] Vercel account (sign up at https://vercel.com if needed)

---

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub (5 minutes)

```powershell
# Navigate to your project
cd "c:\Users\Nextel BPO\OneDrive\Documents\GitHub\AI_CALL_CENTER"

# Stage all changes
git add .

# Commit with message
git commit -m "Ready for Render + Vercel deployment with sale-only QA"

# Push to GitHub
git push origin main
```

**Verify:** Go to GitHub and confirm all files are uploaded.

---

### Step 2: Deploy Backend on Render (10 minutes)

#### A. Create Render Account
1. Go to https://render.com
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up with your **GitHub account**
4. Authorize Render to access your repositories

#### B. Deploy with Blueprint
1. In Render Dashboard, click **"New +"** → **"Blueprint"**
2. Connect your repository: `AI_CALL_CENTER`
3. Render will detect `render.yaml`
4. Click **"Apply"**

Render will create 4 services automatically:
- ✅ `ai-callcenter-backend` (Web Service) - $7/mo
- ✅ `ai-callcenter-ai-service` (Web Service) - $25/mo
- ✅ `ai-callcenter-worker` (Background Worker) - $7/mo
- ✅ `ai-callcenter-redis` (Redis Instance) - $7/mo

**Wait 2-3 minutes** for initial setup.

#### C. Configure Environment Variables

**For: ai-callcenter-backend**
1. Click on the service
2. Go to **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add:
   ```
   MONGO_URI=mongodb+srv://Nextel:Nextel123@cluster0.9eph1nl.mongodb.net/AICallCenter
   ```
5. Click **"Save Changes"**

**For: ai-callcenter-ai-service**
1. Click on the service
2. Go to **"Environment"** tab
3. Add:
   ```
   HF_TOKEN=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
   ```
4. Click **"Save Changes"**

**For: ai-callcenter-worker**
1. Click on the service
2. Go to **"Environment"** tab
3. Add:
   ```
   MONGO_URI=mongodb+srv://Nextel:Nextel123@cluster0.9eph1nl.mongodb.net/AICallCenter
   ```
4. Click **"Save Changes"**

#### D. Wait for Deployment
- Backend API: ~3-5 minutes
- AI Service: **~10-15 minutes** (downloads AI models - this is the longest)
- Worker: ~3-5 minutes
- Redis: ~1-2 minutes

**Watch the logs** to see progress. The AI Service will download:
- Whisper base model (~140MB)
- DistilBERT (~260MB)
- BART (~1.6GB)
- spaCy model (~12MB)

#### E. Get Your Backend URL
1. Click on `ai-callcenter-backend` service
2. Copy the URL at the top (looks like: `https://ai-callcenter-backend.onrender.com`)
3. **Save this URL** - you'll need it for Vercel

---

### Step 3: Deploy Frontend on Vercel (5 minutes)

#### A. Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Sign up with your **GitHub account**
4. Authorize Vercel to access repositories

#### B. Import Project
1. Click **"Add New..."** → **"Project"**
2. Find your repository: `AI_CALL_CENTER`
3. Click **"Import"**

#### C. Configure Project
1. **Framework Preset**: Should auto-detect as **Vite** ✅
2. **Root Directory**: Click **"Edit"** → Enter: `frontend`
3. **Build Command**: `npm run build` (should be auto-filled)
4. **Output Directory**: `dist` (should be auto-filled)

#### D. Add Environment Variable
1. Click **"Environment Variables"**
2. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://ai-callcenter-backend.onrender.com/api`
     *(Replace with your actual backend URL from Step 2E)*
3. Click **"Add"**

#### E. Deploy
1. Click **"Deploy"**
2. Wait ~2-3 minutes
3. You'll get a URL like: `https://your-app.vercel.app`

---

### Step 4: Update CORS (CRITICAL!)

Now that you have your Vercel URL, update the AI Service to allow it:

1. Go back to **Render Dashboard**
2. Click on `ai-callcenter-ai-service`
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://ai-callcenter-backend.onrender.com
   ```
   *(Replace `your-app` with your actual Vercel subdomain)*
6. Click **"Save Changes"**
7. Service will automatically redeploy (~2 minutes)

---

## ✅ Testing Your Deployment

### Test 1: Backend Health
```powershell
curl https://ai-callcenter-backend.onrender.com/api/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-11T...",
  "uptime": 123.45,
  "checks": {
    "database": { "status": "connected" },
    "aiService": { "status": "healthy" }
  }
}
```

### Test 2: AI Service Health
```powershell
curl https://ai-callcenter-ai-service.onrender.com/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "models": {
    "whisper": "base",
    "sentiment": "distilbert-base-uncased-finetuned-sst-2-english"
  },
  "device": "cpu",
  "models_loaded": {
    "whisper": true,
    "sentiment": true,
    "spacy": true
  }
}
```

### Test 3: Frontend
1. Open your Vercel URL: `https://your-app.vercel.app`
2. You should see the login page
3. Click **"Register"**
4. Create a test account:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!@#
   - Role: Agent
5. Login with your new account

### Test 4: Upload a Sale Call
1. Click **"Upload Call"** (or similar)
2. Fill in the form:
   - **Agent Name**: Your name
   - **Campaign**: Test Campaign
   - **Duration**: 300 (seconds)
   - **Call Date**: Today
   - **Audio File**: Upload any .mp3 or .wav file
   - **✅ This call resulted in a SALE** ← Check this box
   - **Sale Amount**: 99.99
   - **Product Sold**: Test Product
3. Click **"Upload"**
4. You should see: "Call uploaded successfully"

### Test 5: Check Processing
1. Go to **"Dashboard"** or **"Calls"** page
2. Find your uploaded call
3. Status should be: `queued` → `processing` → `completed` (takes 2-5 minutes)
4. Refresh the page after 3 minutes
5. Click on the call to see AI analysis results:
   - ✅ Transcript
   - ✅ Sentiment
   - ✅ Summary
   - ✅ Quality Score

---

## 🔍 Monitoring & Logs

### View Render Logs
1. Go to Render Dashboard
2. Click on any service
3. Click **"Logs"** tab
4. See real-time logs

**Useful for:**
- Checking if AI models loaded successfully
- Debugging upload issues
- Monitoring processing status

### Check Queue Stats
```powershell
# Get your auth token first by logging in
$token = "YOUR_JWT_TOKEN_HERE"

# Check queue stats
curl -H "Authorization: Bearer $token" https://ai-callcenter-backend.onrender.com/api/queue/stats
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "waiting": 0,
    "active": 1,
    "completed": 5,
    "failed": 0
  }
}
```

---

## 🚨 Troubleshooting

### Issue: AI Service shows "unhealthy"
**Cause:** Models still downloading (first deployment takes 10-15 min)

**Fix:** Wait longer. Check logs:
```
Loading Whisper model: base...
✅ Whisper (base) loaded successfully
```

### Issue: "CORS error" in browser console
**Cause:** CORS not configured properly

**Fix:**
1. Check `ALLOWED_ORIGINS` in AI Service includes your Vercel URL
2. Make sure there's no trailing slash
3. Redeploy AI Service after adding

### Issue: Calls stuck in "queued" status
**Cause:** Worker not processing

**Fix:**
1. Check worker logs in Render
2. Verify `REDIS_HOST` is set correctly
3. Restart worker service

### Issue: "MongoDB connection failed"
**Cause:** Wrong connection string or network issue

**Fix:**
1. Verify `MONGO_URI` is correct
2. Check MongoDB Atlas → Network Access → Allow all IPs (0.0.0.0/0)
3. Restart backend service

### Issue: Frontend shows blank page
**Cause:** Build error or wrong API URL

**Fix:**
1. Check Vercel deployment logs
2. Verify `VITE_API_URL` is set correctly
3. Redeploy from Vercel dashboard

---

## 💰 Cost Confirmation

After deployment, you'll see these charges:

| Service | Plan | Cost |
|---------|------|------|
| Backend API | Starter | $7/mo |
| AI Service | Standard | $25/mo |
| Worker | Starter | $7/mo |
| Redis | Starter | $7/mo |
| Vercel | Hobby (Free) | $0 |
| **TOTAL** | | **$46/month** ✅ |

**Billing starts from deployment date.**

You can view exact charges in:
- Render: Dashboard → Billing
- Vercel: Settings → Billing (should show $0)

---

## 📈 Performance Expectations

With this setup:
- **Processing Speed**: 2-5 minutes per call
- **Capacity**: 10-15 calls/hour = **120-180 calls/day**
- **Your Volume**: 150 sale calls/day
- **Utilization**: ~80% (good, not maxed out)

**What happens when a call is uploaded:**
1. Frontend → Upload to Backend (instant)
2. Backend → Save to MongoDB (instant)
3. Backend → Add to Redis queue (instant)
4. Worker → Pick from queue (instant)
5. Worker → Send to AI Service (2-5 minutes) ← **This is the slow part**
6. Worker → Save results to MongoDB (instant)
7. Frontend → Shows results (instant)

---

## 🎯 Next Steps After Deployment

### 1. Update Frontend Upload Form
Add sale fields (see `SALE_QA_STRATEGY.md` for code):
- Sale checkbox
- Sale amount input
- Product sold input

### 2. Create First Admin User
```powershell
# Register via frontend, then update in MongoDB:
# users collection → find your user → set role: "admin"
```

### 3. Set Up Monitoring (Optional)
Use **UptimeRobot** (free) to monitor:
- https://ai-callcenter-backend.onrender.com/api/health
- https://ai-callcenter-ai-service.onrender.com/health

Get email alerts if services go down.

### 4. Configure Auto-Scaling (Later)
If volume grows, add more workers:
1. Duplicate worker in Render
2. Change `WORKER_ID` to unique value
3. Deploy

---

## 🆘 Need Help?

**Documentation:**
- Full guide: `RENDER_VERCEL_DEPLOYMENT.md`
- Sale QA strategy: `SALE_QA_STRATEGY.md`
- Quick start: `QUICKSTART_RENDER.md`

**Render Support:**
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
- Community: https://community.render.com

**Vercel Support:**
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs

---

## ✅ Deployment Complete!

Once all services show **"Live"** in Render and Vercel deployment succeeds:

🎉 **Your AI Call Center is LIVE!**

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://ai-callcenter-backend.onrender.com
- **Cost**: $46/month (well under $100 budget)
- **Capacity**: 150 sale calls/day

**Ready to process your first sale call!** 🚀
