#!/bin/bash

# RunPod Auto-Shutdown Script
# Automatically stops the pod after idle period to save costs
# Place this in /workspace/auto-shutdown.sh

IDLE_THRESHOLD=6  # Number of 5-minute intervals (6 = 30 minutes)
IDLE_COUNT_FILE="/tmp/idle_count"

# Get queue statistics
QUEUE_STATS=$(curl -s http://localhost:5000/api/queue/stats 2>/dev/null)

if [ $? -eq 0 ]; then
    WAITING=$(echo "$QUEUE_STATS" | jq -r '.waiting // 0' 2>/dev/null || echo "0")
    ACTIVE=$(echo "$QUEUE_STATS" | jq -r '.active // 0' 2>/dev/null || echo "0")
    
    # Check if queue is empty
    if [ "$WAITING" -eq "0" ] && [ "$ACTIVE" -eq "0" ]; then
        # Increment idle counter
        if [ -f "$IDLE_COUNT_FILE" ]; then
            IDLE_COUNT=$(cat "$IDLE_COUNT_FILE")
            IDLE_COUNT=$((IDLE_COUNT + 1))
        else
            IDLE_COUNT=1
        fi
        
        echo "$IDLE_COUNT" > "$IDLE_COUNT_FILE"
        
        IDLE_MINUTES=$((IDLE_COUNT * 5))
        echo "[$(date)] System idle for $IDLE_MINUTES minutes (threshold: $((IDLE_THRESHOLD * 5)) min)"
        
        # Shutdown if exceeded threshold
        if [ "$IDLE_COUNT" -ge "$IDLE_THRESHOLD" ]; then
            echo "[$(date)] 🛑 Idle threshold reached. Shutting down pod to save costs..."
            
            # Save PM2 processes before shutdown
            pm2 save
            
            # Log shutdown
            echo "[$(date)] Pod shutdown initiated - idle timeout" >> /workspace/shutdown.log
            
            # Stop the pod using runpodctl (if available)
            if command -v runpodctl &> /dev/null; then
                runpodctl stop pod
            else
                # Fallback: stop all services
                pm2 stop all
                echo "[$(date)] Services stopped. Please manually stop pod in RunPod dashboard."
            fi
        fi
    else
        # Queue is active, reset counter
        rm -f "$IDLE_COUNT_FILE"
        echo "[$(date)] Queue active: $ACTIVE processing, $WAITING waiting"
    fi
else
    echo "[$(date)] ⚠️  Could not connect to backend API"
    rm -f "$IDLE_COUNT_FILE"
fi
