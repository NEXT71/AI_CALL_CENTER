### 1. Clone Repository
```bash
git clone https://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@github.com/NEXT71/AI_CALL_CENTER.git
cd AI_CALL_CENTER/ai-service
```

### 2. Create .env Configuration File
```bash
cat > .env << 'EOF'
# GPU Configuration
DEVICE=cuda
WHISPER_MODEL=base
MAX_WORKERS=4

# Model Configuration
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
SUMMARIZATION_MODEL=facebook/bart-large-cnn
SPACY_MODEL=en_core_web_sm

# Server Configuration
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=https://ai-call-center-o7d7.vercel.app,https://ai-call-center-pt0v.onrender.com

# RunPod API Configuration
RUNPOD_API_KEY=rpa_OE77UPNSKN8LZO0Y041YDN3DX29V9O1XGROVCBFU1f15gq
RUNPOD_POD_ID=kphzlxn313ebt8

# HuggingFace Token
HUGGINGFACE_TOKEN=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
EOF
```

### 3. Install System Dependencies
```bash
apt-get update && apt-get install -y ffmpeg
```

### 4. Install PyTorch (CUDA 12.1 Compatible Version)
```bash
pip install torch==2.4.1 torchaudio==2.4.1 --index-url https://download.pytorch.org/whl/cu121
```

### 5. Install Python Dependencies
```bash
# CRITICAL: Install NumPy 1.x for pyannote.audio compatibility
pip install "numpy<2.0,>=1.26.4"

# Install all other dependencies with verified versions
pip install fastapi==0.115.0 uvicorn==0.32.0 python-multipart==0.0.12 python-dotenv==1.0.1 pydantic==2.10.3 transformers==4.47.1 openai-whisper==20250625 librosa==0.10.2.post1 soundfile==0.12.1 pydub==0.25.1 ffmpeg-python==0.2.0 spacy==3.8.3 rapidfuzz==3.10.1 pyannote.audio==3.1.1 pytz==2025.2 psutil==6.1.0
```

### 6. Download Spacy Model
```bash
python -m spacy download en_core_web_sm
```

### 7. Verify Installation & Configuration
```bash
# Check .env file exists and has correct content
cat .env | grep HUGGINGFACE_TOKEN

# Verify NumPy version (MUST be <2.0)
python -c "import numpy; print(f'NumPy: {numpy.__version__}')"

# Verify PyTorch CUDA
python -c "import torch; print(f'CUDA Available: {torch.cuda.is_available()}')"
```

### 8. Start the AI Service (Production-Ready with Auto-Restart)

#### **RECOMMENDED: Production Setup with Auto-Restart & Monitoring**

**Step 1: Create Production Startup Script**
```bash
cat > run_production.sh << 'EOF'
#!/bin/bash

# Production AI Service Runner with Auto-Restart
# Handles crashes, memory issues, log rotation

LOG_FILE="ai_service.log"
MAX_LOG_SIZE=104857600  # 100MB in bytes
RESTART_DELAY=5
MAX_CONSECUTIVE_FAILURES=10
FAILURE_COUNT=0
LAST_RESTART_TIME=0

# Log rotation - prevents disk full
rotate_logs() {
    if [ -f "$LOG_FILE" ]; then
        LOG_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
        if [ "$LOG_SIZE" -gt "$MAX_LOG_SIZE" ]; then
            mv "$LOG_FILE" "${LOG_FILE}.$(date +%Y%m%d_%H%M%S).old"
            echo "Log rotated at $(date)" > "$LOG_FILE"
            # Keep only last 5 old logs
            ls -t ${LOG_FILE}.*.old 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null
        fi
    fi
}

# GPU memory cleanup
cleanup_gpu() {
    python3 << PYEOF
import torch
import gc
if torch.cuda.is_available():
    torch.cuda.empty_cache()
    torch.cuda.synchronize()
gc.collect()
print("GPU memory cleaned")
PYEOF
}

# Health check
check_service_health() {
    sleep 10  # Wait for service to start
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✓ Service health check passed"
        return 0
    else
        echo "✗ Service health check failed"
        return 1
    fi
}

echo "=== AI Service Production Runner Started at $(date) ==="
echo "Process ID: $$"
echo "Log file: $LOG_FILE"
echo "=============================================="

while true; do
    CURRENT_TIME=$(date +%s)
    TIME_SINCE_LAST_RESTART=$((CURRENT_TIME - LAST_RESTART_TIME))
    
    # Reset failure count if service ran for more than 5 minutes
    if [ $TIME_SINCE_LAST_RESTART -gt 300 ]; then
        FAILURE_COUNT=0
    fi
    
    # Rotate logs before starting
    rotate_logs
    
    echo ""
    echo "========================================" | tee -a "$LOG_FILE"
    echo "Starting AI Service at $(date)" | tee -a "$LOG_FILE"
    echo "Attempt: $((FAILURE_COUNT + 1))" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    
    LAST_RESTART_TIME=$(date +%s)
    
    # Run the service
    python main.py 2>&1 | tee -a "$LOG_FILE"
    EXIT_CODE=$?
    
    echo ""
    echo "========================================" | tee -a "$LOG_FILE"
    echo "Service stopped at $(date)" | tee -a "$LOG_FILE"
    echo "Exit code: $EXIT_CODE" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    
    # Increment failure count
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    
    # Check for too many consecutive failures
    if [ $FAILURE_COUNT -ge $MAX_CONSECUTIVE_FAILURES ]; then
        echo "!!! Too many consecutive failures ($FAILURE_COUNT). Stopping auto-restart." | tee -a "$LOG_FILE"
        echo "!!! Check logs and restart manually after fixing issues." | tee -a "$LOG_FILE"
        exit 1
    fi
    
    # Cleanup GPU memory before restart
    echo "Cleaning up GPU memory..." | tee -a "$LOG_FILE"
    cleanup_gpu 2>&1 | tee -a "$LOG_FILE"
    
    # Wait before restart
    echo "Restarting in $RESTART_DELAY seconds..." | tee -a "$LOG_FILE"
    sleep $RESTART_DELAY
done
EOF

chmod +x run_production.sh
```

**Step 2: Start Production Service with Screen**
```bash
# Install screen and monitoring tools
apt-get install -y screen htop curl

# Start the production service in a screen session
screen -S ai_service
./run_production.sh

# Detach: Press Ctrl+A, then D
```

**Step 3: Verify Service is Running**
```bash
# Reattach to screen session
screen -r ai_service

# Or check health endpoint
curl http://localhost:8000/health

# View logs
tail -f ai_service.log
```

---

#### **Alternative Options (Less Robust)**

#### Option A: Using nohup (Simple background running)
```bash
nohup python main.py > ai_service.log 2>&1 &
```
⚠️ **Warning:** No auto-restart on crash

#### Option B: Using screen (Manual restart)
```bash
apt-get install -y screen
screen -S ai_service
python main.py
# Detach: Ctrl+A, then D
```
⚠️ **Warning:** No auto-restart on crash

#### Option C: Using tmux (Manual restart)
```bash
apt-get install -y tmux
tmux new -s ai_service
python main.py
# Detach: Ctrl+B, then D
```
⚠️ **Warning:** No auto-restart on crash

---

#### **Monitoring & Troubleshooting Commands**

```bash
# Check if service is running and healthy
curl http://localhost:8000/health

# Reattach to screen session
screen -r ai_service

# View real-time logs
tail -f ai_service.log

# Monitor GPU usage
nvidia-smi -l 1

# Monitor CPU/RAM usage
htop

# Check running Python processes
ps aux | grep python

# Check disk space (prevent disk full)
df -h

# Find and kill service process
pkill -f "python main.py"

# Manual restart (if needed)
screen -X -S ai_service quit
screen -S ai_service
./run_production.sh
```

---

#### **Common Issues & Solutions**

**Issue 1: Out of Memory (OOM)**
```bash
# Clear GPU cache
python3 -c "import torch; torch.cuda.empty_cache(); print('GPU cleared')"

# Reduce MAX_WORKERS in .env
sed -i 's/MAX_WORKERS=4/MAX_WORKERS=2/' .env
```

**Issue 2: NumPy Compatibility Error**
```bash
pip install --force-reinstall "numpy<2.0,>=1.26.4"
```

**Issue 3: CUDA Out of Memory**
```bash
# Use smaller Whisper model
sed -i 's/WHISPER_MODEL=base/WHISPER_MODEL=tiny/' .env
```

**Issue 4: Disk Full (Logs)**
```bash
# Clear old logs
rm -f ai_service.log.*.old

# Limit log size manually
truncate -s 0 ai_service.log
```

**Issue 5: Port Already in Use**
```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9

# Or change port in .env
sed -i 's/PORT=8000/PORT=8001/' .env
```

---

#### **Production Checklist**

✅ Use `run_production.sh` for auto-restart  
✅ Run inside `screen` session to survive SSH disconnects  
✅ Monitor logs regularly: `tail -f ai_service.log`  
✅ Check disk space weekly: `df -h`  
✅ Monitor GPU memory: `nvidia-smi`  
✅ Test health endpoint: `curl http://localhost:8000/health`  
✅ Keep old logs to max 5 (automatic in script)  
✅ Service auto-restarts on crash within 5 seconds  
✅ Stops after 10 consecutive failures (prevents infinite crash loop)