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
RUNPOD_POD_ID=w8sxidggkky937

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

### 8. Start the AI Service
```bash
python main.py
```
incase some issue occurs
pip install --force-reinstall "numpy<2.0,>=1.26.4"