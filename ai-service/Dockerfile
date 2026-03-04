# Use NVIDIA CUDA base image for GPU support
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV CUDA_HOME=/usr/local/cuda

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    ffmpeg \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install PyTorch with CUDA support (updated to match requirements.txt)
RUN pip3 install --no-cache-dir torch==2.5.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cu121

# Install NumPy first (critical for compatibility with pyannote.audio)
RUN pip3 install --no-cache-dir "numpy>=1.26.4,<2.0.0"

# Install other Python packages
RUN pip3 install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python3 -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Create temp directory for audio files
RUN mkdir -p /tmp && chmod 777 /tmp

# RunPod Serverless doesn't need port exposure or health checks
# The handler function is invoked directly by RunPod runtime

# Run the RunPod serverless handler
CMD ["python3", "main.py"]