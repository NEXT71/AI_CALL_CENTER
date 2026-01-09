# RunPod AI Service Setup Guide

## Complete Setup Commands

Run these commands in your RunPod SSH terminal in order:

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
RUNPOD_POD_ID=in8932xwcw47y3

# HuggingFace Token
HUGGINGFACE_TOKEN=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
EOF
```

### 3. Install System Dependencies
```bash
apt-get update && apt-get install -y ffmpeg
```

### 4. Install PyTorch (Compatible Version)
```bash
pip install torch==2.4.1 torchaudio==2.4.1 --index-url https://download.pytorch.org/whl/cu121
```

### 5. Install Python Dependencies
```bash
# IMPORTANT: Install NumPy 1.x for diarization compatibility
pip install "numpy<2.0"

# Install other dependencies
pip install fastapi==0.115.0 uvicorn==0.32.0 python-multipart==0.0.12 python-dotenv==1.0.1 pydantic==2.10.3 transformers==4.47.1 openai-whisper librosa==0.10.2.post1 soundfile==0.12.1 pydub==0.25.1 ffmpeg-python==0.2.0 spacy==3.8.3 rapidfuzz==3.10.1 pyannote.audio==3.1.1 pytz==2024.2 psutil==6.1.0
```

### 6. Download Spacy Model
```bash
python -m spacy download en_core_web_sm
```

### 7. Verify .env File is Loaded
```bash
# Check .env file exists and has correct content
cat .env | grep HUGGINGFACE_TOKEN
```

### 8. Start the AI Service
```bash
python main.py
```

---

## Troubleshooting

### If diarization fails with NumPy error:
```bash
# Downgrade NumPy to 1.x
pip install "numpy<2.0" --force-reinstall

# Restart service
pkill -f main.py
python main.py
```

### If HuggingFace token not loading:
```bash
# Verify .env file location (must be in /AI_CALL_CENTER/ai-service)
pwd
cat .env | grep HUGGINGFACE_TOKEN

# If .env is missing, recreate it from step 2
```

### If you get "No space left on device" error:
```bash
# Clean up cache
rm -rf ~/.cache/huggingface/hub/*
rm -rf /tmp/*

# Check disk space
df -h
```

### To run service in background:
```bash
nohup python main.py > output.log 2>&1 &

# Check if running
ps aux | grep main.py

# View logs
tail -f output.log
```

### To stop background service:
```bash
pkill -f main.py
```

---

## Expected Output

When successful, you should see:
```
🚀 RunPod GPU AI Service - Production Ready
GPU: NVIDIA GeForce RTX 3070
VRAM: 7.7 GB
Device: CUDA
Port: 8000
Host: 0.0.0.0

INFO: Uvicorn running on http://0.0.0.0:8000
```

---

## Backend Configuration (Render)

Make sure your backend has these environment variables:
```
AI_SERVICE_URL=https://qngcwp5rig5cvc-8000.proxy.runpod.net
RUNPOD_POD_ID=qngcwp5rig5cvc
RUNPOD_API_KEY=rpa_OE77UPNSKN8LZO0Y041YDN3DX29V9O1XGROVCBFU1f15gq
```

---

## Notes

- Service listens on port 8000
- Accessible via RunPod proxy: `https://qngcwp5rig5cvc-8000.proxy.runpod.net`
- Uses Whisper medium model for transcription
- GPU: RTX 3070 with 7.7GB VRAM
- Supports 4 parallel workers for processing
