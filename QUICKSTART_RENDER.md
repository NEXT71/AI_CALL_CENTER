# Quick Start: Render + Vercel Deployment

## Prerequisites
- GitHub account
- Render account (sign up at https://render.com)
- Vercel account (sign up at https://vercel.com)
- MongoDB Atlas database (already configured)

## Step-by-Step Deployment

### 1️⃣ Prepare Repository
```bash
# Make sure all files are committed
git add .
git commit -m "Prepare for Render + Vercel deployment"
git push origin main
```

### 2️⃣ Deploy Backend on Render (5 minutes)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Blueprint"**
3. **Connect your GitHub repository**
4. **Select the repository** containing `render.yaml`
5. **Click "Apply"** - Render will create 4 services automatically:
   - Backend API (Web Service)
   - AI Service (Web Service)  
   - Worker (Background Worker)
   - Redis (Redis Instance)

6. **Configure secrets** (click each service):
   
   **Backend API** → Environment:
   ```
   MONGO_URI=mongodb+srv://Nextel:Nextel123@cluster0.9eph1nl.mongodb.net/AICallCenter
   ```
   
   **AI Service** → Environment:
   ```
   HF_TOKEN=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
   ```
   
   **Worker** → Environment:
   ```
   MONGO_URI=mongodb+srv://Nextel:Nextel123@cluster0.9eph1nl.mongodb.net/AICallCenter
   ```

7. **Wait for deployment** (~10 minutes for AI service to download models)

8. **Copy Backend URL**: `https://ai-callcenter-backend.onrender.com`

### 3️⃣ Deploy Frontend on Vercel (3 minutes)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New..."** → **"Project"**
3. **Import your GitHub repository**
4. **Configure project**:
   - Framework Preset: **Vite**
   - Root Directory: **frontend**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   
5. **Add Environment Variable**:
   ```
   VITE_API_URL=https://ai-callcenter-backend.onrender.com/api
   ```
   
6. **Click "Deploy"**

7. **Copy Vercel URL**: `https://your-app.vercel.app`

### 4️⃣ Update CORS (Important!)

1. **Go back to Render** → **AI Service** → **Environment**
2. **Update**:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://ai-callcenter-backend.onrender.com
   ```
3. **Click "Manual Deploy"** → **"Deploy latest commit"**

### 5️⃣ Test Your Deployment

1. **Open your Vercel URL**: `https://your-app.vercel.app`
2. **Register a new user**
3. **Login**
4. **Upload a test call** with transfer checkbox enabled
5. **Wait ~2-5 minutes** for AI processing
6. **Check results** on dashboard

## ✅ Deployment Complete!

**Monthly Cost**: $46-64 (under your $100 budget)

**Capacity**: 10-15 calls/hour with 1 worker (upgrade to 3-5 workers for 400-500 calls/day)

## 📊 Verify Services

```bash
# Test Backend
curl https://ai-callcenter-backend.onrender.com/api/health

# Test AI Service
curl https://ai-callcenter-ai-service.onrender.com/health

# Both should return: {"status": "healthy", ...}
```

## 🚨 Troubleshooting

### AI Service Crashes
**Issue**: Out of memory
**Fix**: Verify `WHISPER_MODEL=base` in Render dashboard

### Frontend Can't Connect
**Issue**: CORS error
**Fix**: Update `ALLOWED_ORIGINS` in AI Service with your Vercel URL

### Calls Not Processing
**Issue**: Worker not running
**Fix**: Check worker logs in Render dashboard, verify Redis connection

## 📚 Full Documentation
See `RENDER_VERCEL_DEPLOYMENT.md` for complete details, scaling options, and advanced configuration.

## 💡 Next Steps
1. Add more workers if needed (3-5 for 400-500 calls/day)
2. Set up uptime monitoring (UptimeRobot)
3. Implement VicidiaL integration (see TRANSFER_QA_STRATEGY.md)
4. Configure auto-scaling based on queue depth
