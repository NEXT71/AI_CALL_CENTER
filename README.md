# AI Call Center - Quality & Compliance Auto-Scoring Platform

A production-ready MVP for an AI-based call quality and compliance auto-scoring system designed for BPO call centers.

## 🎯 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (Admin, User)
- **Call Upload & Management**: Upload call recordings with metadata
- **Speech-to-Text**: Automated transcription using OpenAI Whisper
- **Compliance Checking**: Rule-based compliance validation against mandatory and forbidden phrases
- **Quality Scoring**: Automated quality assessment based on multiple factors
- **Sentiment Analysis**: NLP-powered sentiment detection using pre-trained BERT models
- **Comprehensive Reports**: Detailed call analysis with recommendations
- **Analytics Dashboard**: Performance insights and trends visualization
- **Responsive UI**: Modern React dashboard with Tailwind CSS

## 🏗️ Architecture

```
AI_CALL_CENTER/
├── backend/          # Node.js + Express REST API
├── frontend/         # React 18 + Vite + Tailwind CSS
└── ai-service/       # Python FastAPI (Whisper + NLP)
```

## 🛠️ Tech Stack

### Backend
- Node.js 20
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Multer (file upload)
- Axios (HTTP client)

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router v6
- Axios
- Lucide React (icons)

### AI Service
- Python 3.12
- FastAPI
- OpenAI Whisper (Speech-to-Text)
- Transformers (BERT for sentiment analysis)
- PyTorch

## 📋 Prerequisites

- Node.js 20+
- Python 3.12+
- MongoDB Atlas account (or local MongoDB)
- 4GB+ RAM recommended
- Git

## 🚀 Quick Start

### 1. Clone Repository

```powershell
cd "C:\Users\Nextel BPO\OneDrive\Documents\GitHub\AI_CALL_CENTER"
```

### 2. Backend Setup

```powershell
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
Copy-Item .env.example .env

# Edit .env and update MongoDB URI if needed
# MONGO_URI is already configured for your Atlas cluster

# Seed database with sample data
npm run seed

# Start backend server
npm run dev
```

Backend will run on http://localhost:5000

### 3. AI Service Setup

```powershell
cd ..\ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Models will download automatically on first run (~500MB)
# Start AI service
python main.py
```

AI Service will run on http://localhost:8000

**Note**: First startup will download Whisper and BERT models (~500MB total). This is a one-time process.

### 4. Frontend Setup

```powershell
cd ..\frontend

# Install dependencies
npm install

# Create .env file
Copy-Item .env.example .env

# Start development server
npm run dev
```

Frontend will run on http://localhost:3000

## 🔑 Login Credentials

After running the seed script, use these credentials:

| Role    | Email                 | Password    |
|---------|-----------------------|-------------|
| Admin   | admin@nextel.com      | Admin123!   |
| Manager | manager@nextel.com    | Manager123! |
| QA      | qa@nextel.com         | QA123!      |
| Agent   | agent1@nextel.com     | Agent123!   |

## 📁 Project Structure

### Backend (`/backend`)

```
backend/
├── src/
│   ├── config/
│   │   ├── config.js           # Environment configuration
│   │   └── database.js         # MongoDB connection
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Call.js             # Call schema
│   │   └── ComplianceRule.js   # Compliance rule schema
│   ├── controllers/
│   │   ├── authController.js   # Auth logic
│   │   ├── callController.js   # Call management
│   │   ├── ruleController.js   # Compliance rules
│   │   └── reportController.js # Analytics & reports
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   ├── callRoutes.js       # Call endpoints
│   │   ├── ruleRoutes.js       # Rule endpoints
│   │   └── reportRoutes.js     # Report endpoints
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   ├── errorHandler.js     # Error handling
│   │   └── validation.js       # Input validation
│   ├── services/
│   │   ├── aiService.js        # AI service integration
│   │   └── scoringService.js   # Scoring logic
│   ├── scripts/
│   │   └── seedData.js         # Database seeding
│   └── server.js               # Express app entry
├── uploads/                    # Audio file storage
├── package.json
└── .env.example
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Main layout
│   │   └── ProtectedRoute.jsx  # Route protection
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Dashboard.jsx       # Dashboard
│   │   ├── CallsList.jsx       # Calls list
│   │   ├── CallDetails.jsx     # Call details
│   │   ├── UploadCall.jsx      # Upload interface
│   │   ├── ComplianceRules.jsx # Rules management
│   │   └── Analytics.jsx       # Analytics page
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state management
│   ├── services/
│   │   ├── api.js              # Axios instance
│   │   └── apiService.js       # API methods
│   ├── App.jsx                 # App routes
│   ├── main.jsx                # Entry point
│   └── index.css               # Tailwind styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

### AI Service (`/ai-service`)

```
ai-service/
├── main.py                     # FastAPI app
├── requirements.txt            # Python dependencies
└── .env.example
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Calls
- `POST /api/calls/upload` - Upload call recording
- `GET /api/calls` - Get all calls (with filters)
- `GET /api/calls/:id` - Get call details
- `GET /api/calls/:id/audio` - Stream audio file
- `DELETE /api/calls/:id` - Delete call

### Compliance Rules
- `POST /api/rules` - Create rule
- `GET /api/rules` - Get all rules
- `GET /api/rules/:id` - Get rule by ID
- `PUT /api/rules/:id` - Update rule
- `DELETE /api/rules/:id` - Delete rule
- `GET /api/rules/campaigns/list` - Get campaigns list

### Reports
- `GET /api/reports/:callId` - Get call report
- `GET /api/reports/analytics/summary` - Get analytics summary

### AI Service
- `POST /ai-service/transcribe` - Transcribe audio
- `POST /ai-service/analyze-sentiment` - Analyze sentiment
- `GET /ai-service/health` - Health check

**⏰ Service Availability**: Monday-Saturday, 6:45 PM Pakistan Standard Time (PKT) to 6:00 AM Pacific Standard Time (PST)

## 🎨 User Interface

### Pages

1. **Login** - Secure authentication
2. **Dashboard** - Overview with key metrics
3. **Calls List** - Searchable/filterable call records
4. **Call Details** - Complete call analysis with:
   - Audio player
   - Transcript
   - Scores (Quality, Compliance, Sentiment)
   - Compliance violations
   - Quality metrics
   - Recommendations
5. **Upload Call** - Upload new recordings
6. **Compliance Rules** - Manage mandatory/forbidden phrases (Admin/Manager)
7. **Analytics** - Performance insights and trends (Admin/Manager/QA)

## 🔐 Role-Based Access

| Feature              | Admin | Manager | QA  | Agent |
|---------------------|-------|---------|-----|-------|
| View Dashboard      | ✅     | ✅       | ✅   | ✅     |
| View Own Calls      | ✅     | ✅       | ✅   | ✅     |
| View All Calls      | ✅     | ✅       | ✅   | ❌     |
| Upload Calls        | ✅     | ✅       | ✅   | ❌     |
| Delete Calls        | ✅     | ✅       | ❌   | ❌     |
| Manage Rules        | ✅     | ✅       | ❌   | ❌     |
| View Analytics      | ✅     | ✅       | ✅   | ❌     |

## 📊 Scoring Logic

### Quality Score (0-100)
- Greeting present: +10
- Proper closing: +10
- Compliance score ≥90: +30
- Positive sentiment: +20
- Appropriate call duration: +10
- Professional language: +10
- Speech rate 120-150 wpm: +10
- Penalty for interruptions: -5 to -15

### Compliance Score (0-100)
- Calculated based on mandatory phrases found
- Heavy penalties for forbidden phrases detected
- Weighted by rule importance (1-10)
- Supports fuzzy matching (tolerance 0-5)

## 🚨 Troubleshooting

### Backend won't start
- Verify MongoDB connection string in `.env`
- Check if port 5000 is available
- Run `npm install` again

### AI Service errors
- Ensure Python 3.12+ is installed
- Activate virtual environment
- Check if models downloaded successfully
- Verify sufficient disk space (~1GB)

### Frontend issues
- Clear browser cache
- Check if backend is running
- Verify `.env` has correct API URL
- Run `npm install` again

### MongoDB connection failed
- Verify MongoDB Atlas cluster is running
- Check IP whitelist settings
- Confirm connection string in `.env`

## 📦 Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure CORS properly
4. Use process manager (PM2)
5. Set up reverse proxy (Nginx)
6. Enable HTTPS

### Frontend
```powershell
npm run build
# Deploy dist/ folder to hosting (Vercel, Netlify, etc.)
```

### AI Service
1. Use production ASGI server (Gunicorn + Uvicorn)
2. Consider GPU for better performance
3. Implement request queuing for heavy load
4. Set up monitoring

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRE=7d
AI_SERVICE_URL=http://localhost:8000
PORT=5000
```

**AI Service (.env)**
```env
WHISPER_MODEL=base
DEVICE=cpu
PORT=8000
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000/api
```

## 📝 Notes

- Audio files stored in `backend/uploads/calls/`
- Supported formats: WAV, MP3, M4A, OGG
- Max file size: 100MB
- Whisper model size: ~150MB (base model)
- BERT model size: ~250MB
- First AI service startup takes 2-3 minutes (model download)

## 🤝 Support

For issues or questions, please check:
1. This README
2. Error logs in console
3. Network tab in browser DevTools

## 📄 License

MIT License - feel free to use for your BPO operations!

---

**Built with ❤️ for Nextel BPO**
