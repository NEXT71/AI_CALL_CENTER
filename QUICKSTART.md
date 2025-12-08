# AI Call Center - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Backend Dependencies
```powershell
cd backend
npm install
```

### Step 2: Setup Database
The `.env` file is already configured with your MongoDB Atlas connection.
```powershell
# Seed the database with sample users and compliance rules
npm run seed
```

You should see output confirming:
- 5 users created (Admin, Manager, QA, 2 Agents)
- Compliance rules for Sales, Customer Service, and Collections campaigns

### Step 3: Start Backend
```powershell
npm run dev
```

Backend should now be running on http://localhost:5000

### Step 4: Setup AI Service (New Terminal)
```powershell
cd ai-service

# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# Install dependencies (this will take 2-3 minutes)
pip install -r requirements.txt

# Start AI service (first run downloads models ~500MB, takes 2-3 min)
python main.py
```

AI Service should now be running on http://localhost:8000

### Step 5: Start Frontend (New Terminal)
```powershell
cd frontend
npm install
npm run dev
```

Frontend should now be running on http://localhost:3000

## ✅ You're Ready!

Open http://localhost:3000 in your browser and login with:
- Email: `admin@nextel.com`
- Password: `Admin123!`

## 🎯 Quick Test Workflow

1. **Login** as admin
2. Go to **Upload Call** page
3. Select an audio file (MP3/WAV)
4. Fill in call details
5. Upload and wait for processing
6. View results in **Calls** page
7. Click on a call to see detailed analysis

## 📊 What's Included

- ✅ 5 demo users (Admin, Manager, QA, 2 Agents)
- ✅ 20+ compliance rules across 3 campaigns
- ✅ Full authentication with JWT
- ✅ Role-based access control
- ✅ AI-powered transcription (Whisper)
- ✅ Sentiment analysis (BERT)
- ✅ Compliance checking
- ✅ Quality scoring
- ✅ Analytics dashboard

## 🔑 All Login Credentials

| Role    | Email                | Password    |
|---------|----------------------|-------------|
| Admin   | admin@nextel.com     | Admin123!   |
| Manager | manager@nextel.com   | Manager123! |
| QA      | qa@nextel.com        | QA123!      |
| Agent   | agent1@nextel.com    | Agent123!   |
| Agent   | agent2@nextel.com    | Agent123!   |

## 🛠️ Troubleshooting

**Backend won't start?**
- Make sure MongoDB Atlas cluster is running
- Check `.env` file exists in backend folder
- Verify Node.js 20+ is installed

**AI Service won't start?**
- Ensure Python 3.12+ is installed
- Make sure virtual environment is activated
- Check internet connection (needed to download models first time)

**Frontend won't start?**
- Verify backend is running on port 5000
- Check `.env` file exists in frontend folder
- Clear browser cache

## 📁 Important Folders

- `backend/uploads/calls/` - Uploaded audio files stored here
- `ai-service/venv/` - Python virtual environment
- `frontend/dist/` - Production build (after `npm run build`)

## 🎮 Next Steps

1. **Explore the Dashboard** - See overview metrics
2. **Upload a Test Call** - Try the upload feature
3. **Manage Compliance Rules** - Add/edit rules for your campaigns
4. **View Analytics** - Check performance insights
5. **Test Different Roles** - Login as different users to see role-based access

## 📚 Need Help?

Check the main README.md for:
- Complete API documentation
- Detailed architecture explanation
- Production deployment guide
- Advanced configuration options

---

**Happy Testing! 🎉**
