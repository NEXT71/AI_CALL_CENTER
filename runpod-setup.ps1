# RunPod Setup Script
# Run this script after creating your RunPod pod to set up the environment

# Exit on any error
$ErrorActionPreference = "Stop"

Write-Host "🚀 RunPod Setup for AI Call Center" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check if running on Linux (RunPod)
if ($IsLinux) {
    Write-Host "✅ Running on Linux (RunPod environment)" -ForegroundColor Green
} else {
    Write-Host "⚠️  This script is designed for RunPod Linux environment" -ForegroundColor Yellow
    Write-Host "Please copy the commands manually or run on RunPod pod" -ForegroundColor Yellow
    exit
}

# Update system
Write-Host "📦 Updating system packages..." -ForegroundColor Yellow
apt-get update -qq
apt-get upgrade -y -qq

# Install Node.js 20
Write-Host "📦 Installing Node.js 20..." -ForegroundColor Yellow
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
$nodeVersion = node --version
Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green

# Install Redis
Write-Host "📦 Installing Redis..." -ForegroundColor Yellow
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Verify Redis
$redisStatus = redis-cli ping
if ($redisStatus -eq "PONG") {
    Write-Host "✅ Redis installed and running" -ForegroundColor Green
} else {
    Write-Host "❌ Redis installation failed" -ForegroundColor Red
    exit 1
}

# Install system dependencies
Write-Host "📦 Installing system dependencies..." -ForegroundColor Yellow
apt-get install -y git ffmpeg libsndfile1 jq

# Install PM2 globally
Write-Host "📦 Installing PM2 process manager..." -ForegroundColor Yellow
npm install -g pm2

# Verify CUDA/GPU
Write-Host "🎮 Checking GPU availability..." -ForegroundColor Yellow
nvidia-smi
$gpuCheck = $LASTEXITCODE
if ($gpuCheck -eq 0) {
    Write-Host "✅ NVIDIA GPU detected and CUDA available" -ForegroundColor Green
} else {
    Write-Host "⚠️  GPU not detected. AI processing will use CPU (slower)" -ForegroundColor Yellow
}

# Clone repository (user needs to provide URL)
Write-Host ""
Write-Host "📥 Repository Setup" -ForegroundColor Cyan
Write-Host "To clone your repository, run:" -ForegroundColor Yellow
Write-Host "  cd /workspace" -ForegroundColor White
Write-Host "  git clone <your-repository-url> AI_CALL_CENTER" -ForegroundColor White
Write-Host ""

# Create directory structure
Write-Host "📁 Creating directory structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "/workspace/uploads" -Force
New-Item -ItemType Directory -Path "/workspace/logs" -Force

# Set permissions
chmod 755 /workspace/start-services.sh 2>$null
chmod 755 /workspace/auto-shutdown.sh 2>$null
chmod 755 /workspace/scheduled-shutdown.sh 2>$null

Write-Host ""
Write-Host "✅ RunPod setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Clone your repository to /workspace/AI_CALL_CENTER" -ForegroundColor White
Write-Host "2. Update .env files with your MongoDB URI and secrets" -ForegroundColor White
Write-Host "3. Run: cd /workspace/AI_CALL_CENTER/backend && npm install" -ForegroundColor White
Write-Host "4. Run: cd /workspace/AI_CALL_CENTER/ai-service && pip install -r requirements.txt" -ForegroundColor White
Write-Host "5. Download AI models: python setup.py" -ForegroundColor White
Write-Host "6. Start services: /workspace/start-services.sh" -ForegroundColor White
Write-Host ""
