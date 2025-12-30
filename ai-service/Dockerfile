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

# Install PyTorch with CUDA support
RUN pip3 install --no-cache-dir torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu121

# Install other Python packages
RUN pip3 install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python3 -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python3 -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run the application
CMD ["python3", "main.py"]