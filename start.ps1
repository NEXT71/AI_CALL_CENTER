# AI Call Center - Startup Script
# This script helps you start all three services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Call Center - Service Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running from correct directory
if (!(Test-Path "backend") -or !(Test-Path "frontend") -or !(Test-Path "ai-service")) {
    Write-Host "❌ Error: Please run this script from the AI_CALL_CENTER root directory" -ForegroundColor Red
    exit 1
}

# Function to check if a port is in use
function Test-Port {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
    return $connection
}

Write-Host "📋 Pre-flight checks..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 20+" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.12+" -ForegroundColor Red
    exit 1
}

# Check if ports are available
Write-Host ""
Write-Host "🔍 Checking ports..." -ForegroundColor Yellow

if (Test-Port 5000) {
    Write-Host "⚠️  Port 5000 is in use. Backend may not start." -ForegroundColor Yellow
}

if (Test-Port 8000) {
    Write-Host "⚠️  Port 8000 is in use. AI Service may not start." -ForegroundColor Yellow
}

if (Test-Port 3000) {
    Write-Host "⚠️  Port 3000 is in use. Frontend may not start." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "1️⃣  Starting Backend (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start AI Service
Write-Host "2️⃣  Starting AI Service (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-service; if (Test-Path venv\Scripts\Activate.ps1) { .\venv\Scripts\Activate.ps1 } else { Write-Host 'Virtual environment not found. Run: python -m venv venv' -ForegroundColor Red; pause }; python main.py" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "3️⃣  Starting Frontend (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ All services are starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Service URLs:" -ForegroundColor Yellow
Write-Host "   Backend:    http://localhost:5000" -ForegroundColor White
Write-Host "   AI Service: http://localhost:8000" -ForegroundColor White
Write-Host "   Frontend:   http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Login with:" -ForegroundColor Yellow
Write-Host "   Email:    admin@nextel.com" -ForegroundColor White
Write-Host "   Password: Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Wait 10-15 seconds for all services to fully start..." -ForegroundColor Yellow
Write-Host "📖 Check the new terminal windows for status messages" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to open browser..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✨ Done! Happy testing!" -ForegroundColor Green
Write-Host ""
