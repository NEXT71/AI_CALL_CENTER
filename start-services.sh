#!/bin/bash

# RunPod Startup Script - Auto-start all services
# Place this in /workspace/start-services.sh

set -e

echo "🚀 Starting AI Call Center services on RunPod..."

# Wait for system to be ready
sleep 5

# Start Redis
echo "📦 Starting Redis..."
redis-server --daemonize yes
sleep 2

# Verify Redis is running
redis-cli ping || {
    echo "❌ Redis failed to start"
    exit 1
}

# Start AI Service
echo "🤖 Starting AI Service (FastAPI with GPU)..."
cd /workspace/AI_CALL_CENTER/ai-service
pm2 start main.py --name ai-service --interpreter python3 --watch

# Wait for AI service to be ready
sleep 5

# Start Backend API
echo "🌐 Starting Backend API..."
cd /workspace/AI_CALL_CENTER/backend
pm2 start src/server.js --name backend-api --watch

# Start Worker for queue processing
echo "⚙️  Starting Call Processing Worker..."
pm2 start src/workers/callProcessor.js --name call-worker --watch

# Save PM2 process list
pm2 save

# Display status
echo ""
echo "✅ All services started successfully!"
echo ""
pm2 list
echo ""
echo "📊 GPU Status:"
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader
echo ""
echo "🔗 Access URLs:"
echo "   Backend API: http://localhost:5000"
echo "   AI Service:  http://localhost:8000"
echo "   RunPod Proxy: https://your-pod-id-5000.proxy.runpod.net"
echo ""
echo "📝 View logs: pm2 logs"
echo "📊 Monitor: pm2 monit"
