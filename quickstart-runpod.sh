#!/bin/bash

# Quick Start Script for RunPod
# This script combines setup and start in one command

echo "🚀 AI Call Center - RunPod Quick Start"
echo "======================================"
echo ""

# Check if this is first run
if [ ! -d "/workspace/AI_CALL_CENTER" ]; then
    echo "📥 First-time setup detected..."
    echo ""
    
    # Run setup
    bash /workspace/AI_CALL_CENTER/runpod-setup.sh
    
    echo ""
    echo "⚠️  Setup complete! Please configure your .env files:"
    echo "   1. cd /workspace/AI_CALL_CENTER/backend"
    echo "   2. cp .env.example .env"
    echo "   3. Edit .env with your MongoDB URI and secrets"
    echo "   4. cd /workspace/AI_CALL_CENTER/ai-service"
    echo "   5. cp .env.example .env"
    echo "   6. Edit .env with your HuggingFace token"
    echo ""
    echo "Then run this script again to start services."
    exit 0
fi

# Check if .env files exist
if [ ! -f "/workspace/AI_CALL_CENTER/backend/.env" ]; then
    echo "❌ Backend .env file not found!"
    echo "Please create it from .env.example and configure your settings."
    exit 1
fi

if [ ! -f "/workspace/AI_CALL_CENTER/ai-service/.env" ]; then
    echo "❌ AI Service .env file not found!"
    echo "Please create it from .env.example and configure your settings."
    exit 1
fi

# Start services
echo "🚀 Starting all services..."
bash /workspace/AI_CALL_CENTER/start-services.sh

echo ""
echo "✅ Services started!"
echo ""
echo "📊 To monitor:"
echo "   pm2 monit          - Interactive monitor"
echo "   pm2 logs           - View all logs"
echo "   pm2 status         - Service status"
echo ""
echo "🛑 To stop:"
echo "   pm2 stop all       - Stop all services"
echo "   pm2 restart all    - Restart all services"
echo ""
