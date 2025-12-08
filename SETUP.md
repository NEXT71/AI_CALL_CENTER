# ⚠️ IMPORTANT: Read Before Starting

## First-Time Setup Checklist

### Prerequisites Installed?
- [ ] Node.js 20 or higher
- [ ] Python 3.12 or higher
- [ ] Git
- [ ] 4GB+ free RAM
- [ ] 2GB+ free disk space (for AI models)

### Verify Installations
```powershell
node --version    # Should show v20.x.x or higher
python --version  # Should show Python 3.12.x or higher
npm --version     # Should show 10.x.x or higher
```

## MongoDB Atlas Configuration

Your MongoDB connection is already configured in `backend/.env`:
```
MONGO_URI=mongodb+srv://Nextel:Nextel123@cluster0.9eph1nl.mongodb.net/AICallCenter
```

✅ This should work automatically
❗ If connection fails, verify your MongoDB Atlas cluster is running

## Installation Order (IMPORTANT!)

**You MUST start services in this order:**

1. **Backend First** (Port 5000)
2. **AI Service Second** (Port 8000)  
3. **Frontend Last** (Port 3000)

## Known Issues & Solutions

### Issue: "Module not found" errors
**Solution:** Run `npm install` in the respective folder

### Issue: AI Service takes long to start first time
**Solution:** This is normal! First run downloads ~500MB of models. Wait 2-3 minutes.

### Issue: Port already in use
**Solution:** 
```powershell
# Check what's using the port
netstat -ano | findstr :5000
# Kill the process or change port in .env
```

### Issue: MongoDB connection timeout
**Solution:** 
- Check internet connection
- Verify MongoDB Atlas cluster is active
- Check IP whitelist in Atlas (should allow all IPs or your specific IP)

### Issue: CORS errors in browser
**Solution:** Make sure backend is running before starting frontend

## Development Workflow

### Daily Startup Sequence

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - AI Service:**
```powershell
cd ai-service
.\venv\Scripts\Activate.ps1
python main.py
```

**Terminal 3 - Frontend:**
```powershell
cd frontend
npm run dev
```

### When to Restart Services

**Restart Backend when:**
- You modify any .js file in backend/src/
- You change .env file
- You add new npm packages

**Restart AI Service when:**
- You modify main.py
- You change Python dependencies
- You update .env file

**Frontend auto-reloads** when you save files (no restart needed)

## First-Time Model Download

When you first start the AI service, it will download:
- Whisper model (~150MB)
- BERT sentiment model (~250MB)

**This only happens once!** Subsequent starts are fast.

Progress will show in terminal:
```
🔄 Loading Whisper model: base...
Downloading model...
✅ Whisper model loaded successfully
```

## Testing the Installation

### 1. Test Backend
Open http://localhost:5000/health

Should see:
```json
{
  "success": true,
  "message": "AI Call Center API is running"
}
```

### 2. Test AI Service
Open http://localhost:8000/health

Should see:
```json
{
  "status": "healthy",
  "models_loaded": true
}
```

### 3. Test Frontend
Open http://localhost:3000

Should see the login page

## Sample Test Data

After running `npm run seed`, you'll have:

**Users:** 5 (1 Admin, 1 Manager, 1 QA, 2 Agents)
**Compliance Rules:** 20+ rules across 3 campaigns:
- Sales (8 rules)
- Customer Service (7 rules)
- Collections (5 rules)

## Production Deployment Notes

This is an MVP setup for development. For production:

1. **Change all secrets** in .env files
2. **Enable HTTPS** on all services
3. **Set up proper CORS** (not allow-all)
4. **Use environment variables** for sensitive data
5. **Set up monitoring** and logging
6. **Use PM2** or similar for Node.js
7. **Use Gunicorn + Uvicorn** for Python
8. **Store files in S3** instead of local filesystem
9. **Set up database backups**
10. **Enable rate limiting**

## Getting Help

1. Check QUICKSTART.md for setup steps
2. Check README.md for detailed documentation
3. Look at error messages in terminal
4. Check browser console for frontend errors
5. Verify all 3 services are running

## Directory Structure Overview

```
AI_CALL_CENTER/
├── backend/              # Node.js API (Port 5000)
│   ├── src/
│   ├── uploads/         # Uploaded audio files
│   ├── .env            # Configuration (already set)
│   └── package.json
├── ai-service/          # Python AI Service (Port 8000)
│   ├── main.py
│   ├── venv/           # Virtual environment
│   └── requirements.txt
├── frontend/            # React App (Port 3000)
│   ├── src/
│   ├── .env            # Configuration
│   └── package.json
├── README.md           # Full documentation
└── QUICKSTART.md       # Quick setup guide
```

---

## Ready to Start?

Follow the steps in **QUICKSTART.md** to get everything running!

**Estimated setup time:** 10-15 minutes (including model downloads)
