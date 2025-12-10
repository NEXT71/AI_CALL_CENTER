#!/bin/bash

# RunPod Initial Setup Script
# This script sets up the complete environment on a fresh RunPod pod
# Usage: bash runpod-setup.sh

set -e

echo "🚀 RunPod Setup for AI Call Center"
echo "==================================="
echo ""

# Update system
echo "📦 Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node.js
NODE_VERSION=$(node --version)
echo "✅ Node.js installed: $NODE_VERSION"

# Install Redis
echo "📦 Installing Redis..."
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Verify Redis
if redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis installed and running"
else
    echo "❌ Redis installation failed"
    exit 1
fi

# Install system dependencies
echo "📦 Installing system dependencies..."
apt-get install -y git ffmpeg libsndfile1 jq htop

# Install Python dependencies
echo "📦 Installing Python tools..."
pip install --upgrade pip

# Install PM2 globally
echo "📦 Installing PM2 process manager..."
npm install -g pm2

# Verify CUDA/GPU
echo "🎮 Checking GPU availability..."
if nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA GPU detected:"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else
    echo "⚠️  GPU not detected. AI processing will use CPU (slower)"
fi

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p /workspace/uploads/calls
mkdir -p /workspace/logs
mkdir -p /workspace/backups

# Set permissions for scripts
if [ -f "/workspace/AI_CALL_CENTER/start-services.sh" ]; then
    chmod +x /workspace/AI_CALL_CENTER/start-services.sh
fi

if [ -f "/workspace/AI_CALL_CENTER/auto-shutdown.sh" ]; then
    chmod +x /workspace/AI_CALL_CENTER/auto-shutdown.sh
fi

if [ -f "/workspace/AI_CALL_CENTER/scheduled-shutdown.sh" ]; then
    chmod +x /workspace/AI_CALL_CENTER/scheduled-shutdown.sh
fi

echo ""
echo "✅ RunPod base setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Clone your repository:"
echo "   cd /workspace"
echo "   git clone <your-repo-url> AI_CALL_CENTER"
echo ""
echo "2. Install backend dependencies:"
echo "   cd /workspace/AI_CALL_CENTER/backend"
echo "   npm install"
echo ""
echo "3. Install AI service dependencies:"
echo "   cd /workspace/AI_CALL_CENTER/ai-service"
echo "   pip install -r requirements.txt"
echo "   python setup.py"
echo ""
echo "4. Configure environment files:"
echo "   - Copy .env.example to .env in backend/"
echo "   - Copy .env.example to .env in ai-service/"
echo "   - Update MongoDB URI and secrets"
echo ""
echo "5. Start services:"
echo "   /workspace/AI_CALL_CENTER/start-services.sh"
echo ""
