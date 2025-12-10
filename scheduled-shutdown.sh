#!/bin/bash

# RunPod Time-Based Shutdown Script
# Shuts down pod at specified time (e.g., end of business day)
# Place this in /workspace/scheduled-shutdown.sh

echo "[$(date)] 🕐 Scheduled shutdown initiated"

# Get current queue stats before shutdown
QUEUE_STATS=$(curl -s http://localhost:5000/api/queue/stats 2>/dev/null)

if [ $? -eq 0 ]; then
    WAITING=$(echo "$QUEUE_STATS" | jq -r '.waiting // 0' 2>/dev/null || echo "0")
    ACTIVE=$(echo "$QUEUE_STATS" | jq -r '.active // 0' 2>/dev/null || echo "0")
    
    echo "[$(date)] Queue status before shutdown: $ACTIVE active, $WAITING waiting"
    
    # If there are active jobs, wait up to 10 minutes for them to complete
    if [ "$ACTIVE" -gt "0" ]; then
        echo "[$(date)] ⏳ Waiting for $ACTIVE active jobs to complete..."
        
        WAIT_COUNT=0
        MAX_WAIT=20  # 20 iterations × 30 seconds = 10 minutes
        
        while [ "$ACTIVE" -gt "0" ] && [ "$WAIT_COUNT" -lt "$MAX_WAIT" ]; do
            sleep 30
            QUEUE_STATS=$(curl -s http://localhost:5000/api/queue/stats 2>/dev/null)
            ACTIVE=$(echo "$QUEUE_STATS" | jq -r '.active // 0' 2>/dev/null || echo "0")
            WAIT_COUNT=$((WAIT_COUNT + 1))
            echo "[$(date)] Still waiting... ($ACTIVE active jobs, waited $((WAIT_COUNT * 30)) seconds)"
        done
        
        if [ "$ACTIVE" -gt "0" ]; then
            echo "[$(date)] ⚠️  Timeout reached. $ACTIVE jobs still active. Proceeding with shutdown."
        else
            echo "[$(date)] ✅ All active jobs completed."
        fi
    fi
fi

# Save PM2 state
echo "[$(date)] 💾 Saving PM2 process list..."
pm2 save

# Stop all services gracefully
echo "[$(date)] 🛑 Stopping all services..."
pm2 stop all

# Log shutdown
echo "[$(date)] Scheduled shutdown completed. Queue: $ACTIVE active, $WAITING waiting" >> /workspace/shutdown.log

# Stop pod using runpodctl (if available)
if command -v runpodctl &> /dev/null; then
    echo "[$(date)] Stopping RunPod pod..."
    runpodctl stop pod
else
    echo "[$(date)] ⚠️  runpodctl not found. Please manually stop pod in RunPod dashboard."
fi

echo "[$(date)] ✅ Shutdown complete"
