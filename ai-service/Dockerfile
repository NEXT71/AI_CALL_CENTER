# Multi-stage build for serverless optimization
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04 AS base

# Set environment variables for serverless
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV CUDA_HOME=/usr/local/cuda
ENV PYTHONPATH=/app
ENV TRANSFORMERS_CACHE=/tmp/transformers_cache
ENV HF_HOME=/tmp/huggingface

# Install minimal system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    ffmpeg \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create app user for security
RUN useradd --create-home --shell /bin/bash app \
    && mkdir -p /app /tmp/transformers_cache /tmp/huggingface \
    && chown -R app:app /app /tmp/transformers_cache /tmp/huggingface

# Switch to app user
USER app
WORKDIR /app

# Copy requirements first (for better caching)
COPY --chown=app:app requirements.txt .

# Install PyTorch with CUDA support (optimized for serverless)
RUN pip3 install --no-cache-dir --user torch==2.5.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cu121

# Install other Python packages (optimized order for serverless)
RUN pip3 install --no-cache-dir --user \
    numpy<2.0.0 \
    fastapi==0.115.0 \
    uvicorn[standard]==0.32.0 \
    python-multipart==0.0.12 \
    python-dotenv==1.0.1 \
    pydantic==2.10.3 \
    transformers==4.47.1 \
    rapidfuzz==3.10.1 \
    pytz==2024.2 \
    psutil==6.1.0 \
    && pip3 install --no-cache-dir --user \
    openai-whisper==20231117 \
    librosa==0.10.2.post1 \
    soundfile==0.12.1 \
    pydub==0.25.1 \
    ffmpeg-python==0.2.0 \
    spacy==3.8.3

# Download spaCy model (cached layer)
RUN python3 -m spacy download en_core_web_sm

# Copy application code
COPY --chown=app:app . .

# Create startup script for serverless
RUN echo '#!/bin/bash\n\
echo "🚀 Starting AI Service..."\n\
python3 -c "import torch; print(f\"GPU Available: {torch.cuda.is_available()}\")"\n\
if [ $? -eq 0 ]; then\n\
    echo "✅ GPU detected, starting with CUDA support"\n\
    exec python3 main.py\n\
else\n\
    echo "⚠️ No GPU detected, starting with CPU fallback"\n\
    exec python3 main.py\n\
fi' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 8000

# Health check for serverless
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Use startup script for queue-based deployment
CMD ["/app/start.sh"]