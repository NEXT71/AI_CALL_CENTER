import os
import uvicorn
import uuid
import shutil
import re
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv
import warnings
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
import torch
from datetime import datetime, time, timedelta
import pytz

# Suppress warnings
warnings.filterwarnings("ignore")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def is_service_available():
    """
    Check if the AI service is available based on schedule:
    Monday-Saturday, 6:45 PM PKT to 6:00 AM PST
    """
    try:
        # Get current time in UTC
        now_utc = datetime.now(pytz.UTC)
        current_day = now_utc.weekday()  # 0=Monday, 6=Sunday
        current_time = now_utc.time()

        # Service only runs Monday-Saturday (0-5), not Sunday (6)
        if current_day == 6:  # Sunday
            return False

        # Define time zones
        pkt = pytz.timezone('Asia/Karachi')  # Pakistan Standard Time
        pst = pytz.timezone('US/Pacific')    # Pacific Standard Time

        # Get today's date in PKT and PST
        today_pkt = now_utc.astimezone(pkt).date()
        today_pst = now_utc.astimezone(pst).date()

        # Start time: 6:45 PM PKT
        start_time_pkt = time(18, 45)  # 6:45 PM
        start_datetime = pkt.localize(datetime.combine(today_pkt, start_time_pkt))

        # End time: 6:00 AM PST (next day)
        end_time_pst = time(6, 0)  # 6:00 AM
        end_datetime = pst.localize(datetime.combine(today_pst, end_time_pst))

        # If end time is before start time (crossing midnight), add a day to end time
        if end_datetime <= start_datetime:
            end_datetime = pst.localize(datetime.combine(today_pst + timedelta(days=1), end_time_pst))

        # Convert to UTC for comparison
        start_utc = start_datetime.astimezone(pytz.UTC)
        end_utc = end_datetime.astimezone(pytz.UTC)

        # Check if current UTC time is within the window
        return start_utc <= now_utc <= end_utc

    except Exception as e:
        logger.error(f"Error checking service availability: {e}")
        return False  # Default to unavailable on error

# GPU Configuration for RunPod
CUDA_AVAILABLE = torch.cuda.is_available()
DEVICE = "cuda" if CUDA_AVAILABLE else "cpu"
DEVICE_ID = 0 if CUDA_AVAILABLE else -1

if CUDA_AVAILABLE:
    GPU_NAME = torch.cuda.get_device_name(0)
    VRAM_GB = torch.cuda.get_device_properties(0).total_memory / 1024**3
    logger.info(f"🎮 GPU Detected: {GPU_NAME}")
    logger.info(f"💾 VRAM Available: {VRAM_GB:.1f} GB")
    logger.info(f"✅ CUDA Version: {torch.version.cuda}")
else:
    logger.warning("⚠️  No GPU detected! Running on CPU (will be slower)")

# Thread pool for parallel chunk processing
MAX_WORKERS = int(os.getenv("MAX_WORKERS", "4"))
executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

# Global model variables (lazy loaded)
whisper_model = None
sentiment_pipeline = None
summarizer_pipeline = None
ner_pipeline = None
nlp_spacy = None
diarization_pipeline = None

# Initialize FastAPI app
app = FastAPI(
    title="AI Call Center - RunPod GPU Service",
    description="Optimized for NVIDIA RTX 2000 Ada on RunPod - Handles 30+ minute calls",
    version="2.0.0"
)

# CORS configuration - Allow all origins for RunPod
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Custom middleware for service availability
@app.middleware("http")
async def check_service_availability(request: Request, call_next):
    """Check if service is available based on schedule before processing requests"""
    # TEMPORARILY DISABLED FOR TESTING - Allow 24/7 access
    return await call_next(request)
    
    """
    # ORIGINAL CODE - Uncomment to re-enable schedule restrictions
    # Allow health checks even when service is unavailable
    if request.url.path == "/health":
        return await call_next(request)

    if not is_service_available():
        return JSONResponse(
            status_code=503,
            content={
                "error": "Service Unavailable",
                "message": "AI service is only available Monday-Saturday from 6:45 PM PKT to 6:00 AM PST",
                "available_days": "Monday-Saturday",
                "available_hours": "6:45 PM Pakistan Time to 6:00 AM Pacific Time"
            }
        )

    response = await call_next(request)
    return response
    """

# Model availability flags
models_available = {
    "whisper": False,
    "sentiment": False,
    "summarizer": False,
    "ner": False,
    "spacy": False,
    "diarization": False,
    "gpu_enabled": CUDA_AVAILABLE
}

def load_whisper_model():
    """Lazy load Whisper model with GPU support"""
    global whisper_model, models_available
    if whisper_model is not None:
        return whisper_model

    try:
        import whisper
        
        # Choose model based on GPU availability
        if CUDA_AVAILABLE:
            model_size = os.getenv("WHISPER_MODEL", "medium")  # medium or large-v2 for GPU
            logger.info(f"🚀 Loading Whisper model on GPU: {model_size}")
        else:
            model_size = os.getenv("WHISPER_MODEL", "base")
            logger.info(f"Loading Whisper model on CPU: {model_size}")
        
        whisper_model = whisper.load_model(model_size)
        
        # Move to GPU if available
        if CUDA_AVAILABLE:
            whisper_model = whisper_model.cuda()
            logger.info(f"✅ Whisper model loaded on GPU")
        
        models_available["whisper"] = True
        return whisper_model
    except Exception as e:
        logger.error(f"❌ Failed to load Whisper model: {e}")
        models_available["whisper"] = False
        return None

def load_sentiment_model():
    """Lazy load sentiment analysis model with GPU support"""
    global sentiment_pipeline, models_available
    if sentiment_pipeline is not None:
        return sentiment_pipeline

    try:
        from transformers import pipeline
        
        model_name = os.getenv("SENTIMENT_MODEL", "distilbert-base-uncased-finetuned-sst-2-english")
        logger.info(f"Loading sentiment model on device {DEVICE_ID}: {model_name}")
        
        sentiment_pipeline = pipeline(
            "sentiment-analysis", 
            model=model_name, 
            device=DEVICE_ID,  # 0 for GPU, -1 for CPU
            truncation=True,
            max_length=512
        )
        
        models_available["sentiment"] = True
        logger.info("✅ Sentiment model loaded successfully")
        return sentiment_pipeline
    except Exception as e:
        logger.error(f"❌ Failed to load sentiment model: {e}")
        models_available["sentiment"] = False
        return None

def load_summarizer_model():
    """Lazy load summarization model with GPU support"""
    global summarizer_pipeline, models_available
    if summarizer_pipeline is not None:
        return summarizer_pipeline

    try:
        from transformers import pipeline
        
        model_name = os.getenv("SUMMARIZATION_MODEL", "facebook/bart-large-cnn")
        logger.info(f"Loading summarizer model on device {DEVICE_ID}: {model_name}")
        
        summarizer_pipeline = pipeline(
            "summarization", 
            model=model_name, 
            device=DEVICE_ID
        )
        
        models_available["summarizer"] = True
        logger.info("✅ Summarizer model loaded successfully")
        return summarizer_pipeline
    except Exception as e:
        logger.error(f"❌ Failed to load summarizer model: {e}")
        models_available["summarizer"] = False
        return None

def load_ner_model():
    """Lazy load NER model with GPU support"""
    global ner_pipeline, models_available
    if ner_pipeline is not None:
        return ner_pipeline

    try:
        from transformers import pipeline
        
        logger.info(f"Loading NER model on device {DEVICE_ID}")
        ner_pipeline = pipeline(
            "ner", 
            aggregation_strategy="simple", 
            device=DEVICE_ID
        )
        
        models_available["ner"] = True
        logger.info("✅ NER model loaded successfully")
        return ner_pipeline
    except Exception as e:
        logger.error(f"❌ Failed to load NER model: {e}")
        models_available["ner"] = False
        return None

def load_spacy_model():
    """Lazy load spaCy model"""
    global nlp_spacy, models_available
    if nlp_spacy is not None:
        return nlp_spacy

    try:
        import spacy
        logger.info("Loading spaCy model: en_core_web_sm")
        nlp_spacy = spacy.load("en_core_web_sm")
        models_available["spacy"] = True
        logger.info("✅ spaCy model loaded successfully")
        return nlp_spacy
    except Exception as e:
        logger.error(f"❌ Failed to load spaCy model: {e}")
        models_available["spacy"] = False
        return None

# Configuration
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "medium" if CUDA_AVAILABLE else "base")
SENTIMENT_MODEL = os.getenv("SENTIMENT_MODEL", "distilbert-base-uncased-finetuned-sst-2-english")
SPACY_MODEL = os.getenv("SPACY_MODEL", "en_core_web_sm")
SUMMARIZATION_MODEL = os.getenv("SUMMARIZATION_MODEL", "facebook/bart-large-cnn")

# Pydantic models
class TranscribeRequest(BaseModel):
    audio_path: str

class TranscribeResponse(BaseModel):
    text: str
    timestamps: Optional[List[Dict]] = []
    language: Optional[str] = None
    duration: Optional[float] = None
    word_count: Optional[int] = None

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    label: str
    score: float
    confidence: Optional[str] = None

class EntityRequest(BaseModel):
    text: str

class EntityResponse(BaseModel):
    entities: List[Dict]
    key_phrases: List[str]

class SummarizeRequest(BaseModel):
    text: str
    max_length: Optional[int] = 130
    min_length: Optional[int] = 30

class SummarizeResponse(BaseModel):
    summary: str

class ComplianceCheckRequest(BaseModel):
    transcript: str
    mandatory_phrases: List[str]
    forbidden_phrases: List[str]
    fuzzy_threshold: Optional[int] = 80

class ComplianceCheckResponse(BaseModel):
    missing_mandatory: List[str]
    detected_forbidden: List[str]
    compliance_score: float
    details: Dict

class DiarizeResponse(BaseModel):
    speaker_segments: List[Dict]
    speakers: List[str]
    num_speakers: int

class TalkTimeResponse(BaseModel):
    speaker_talk_time: Dict[str, float]
    agent_customer_ratio: str
    dead_air_total: float
    dead_air_segments: List[Dict]
    total_duration: float

class TranscribeWithSpeakersResponse(BaseModel):
    text: str
    speaker_labeled_text: str
    timestamps: Optional[List[Dict]] = []
    speaker_segments: List[Dict]
    speakers: List[str]
    language: Optional[str] = None
    duration: Optional[float] = None
    word_count: Optional[int] = None


def chunk_audio_file(audio_path: str, chunk_length_ms: int = 600000, overlap_ms: int = 5000):
    """
    Split audio file into chunks for processing long recordings
    chunk_length_ms: chunk length in milliseconds (default 10 minutes)
    overlap_ms: overlap between chunks in milliseconds (default 5 seconds) to prevent word splitting
    """
    try:
        from pydub import AudioSegment
        import gc
        
        logger.info(f"📦 Chunking audio file: {audio_path}")
        audio = AudioSegment.from_file(audio_path)
        
        # Convert to mono and set sample rate BEFORE chunking
        if audio.channels > 1:
            audio = audio.set_channels(1)
            logger.info(f"✅ Converted to mono audio ({audio.channels} channel)")
        
        # Set consistent sample rate
        if audio.frame_rate != 16000:
            audio = audio.set_frame_rate(16000)
            logger.info(f"✅ Set sample rate to 16000 Hz")
        
        duration_ms = len(audio)
        
        # Validate chunk size
        if chunk_length_ms > duration_ms:
            chunk_length_ms = duration_ms
        
        chunks = []
        step = chunk_length_ms - overlap_ms  # Step with overlap
        
        for i in range(0, duration_ms, step):
            chunk_end = min(i + chunk_length_ms, duration_ms)
            chunk = audio[i:chunk_end]
            
            # Ensure chunk is mono (double-check)
            if chunk.channels > 1:
                chunk = chunk.set_channels(1)
            
            chunk_path = f"{audio_path}_chunk_{i//step}.wav"
            # Export as WAV - already mono and 16kHz from parent audio
            chunk.export(chunk_path, format="wav")
            chunks.append({
                "path": chunk_path,
                "start_time": i / 1000,
                "end_time": chunk_end / 1000,
                "overlap_start": (i + overlap_ms) / 1000 if i > 0 else 0
            })
            
            # Free memory after each chunk
            del chunk
            
            # Break if we've reached the end
            if chunk_end >= duration_ms:
                break
        
        # Explicitly free memory
        del audio
        gc.collect()
        
        logger.info(f"✅ Created {len(chunks)} chunks with {overlap_ms}ms overlap")
        return chunks, duration_ms / 1000
    except Exception as e:
        logger.error(f"❌ Failed to chunk audio: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None, None


def transcribe_chunk(model, chunk_path, chunk_info):
    """Transcribe a single audio chunk with GPU acceleration and memory management"""
    import gc
    try:
        logger.info(f"🎙️ Transcribing chunk: {os.path.basename(chunk_path)}")
        
        # Enable FP16 only on GPU for 2x speed boost
        use_fp16 = CUDA_AVAILABLE
        
        # Clear GPU cache before processing
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
        
        result = model.transcribe(
            chunk_path,
            verbose=False,
            fp16=use_fp16,  # FP16 for GPU, disabled for CPU
            language=None,  # Auto-detect language
            temperature=0.0,  # Deterministic output
            compression_ratio_threshold=2.4,  # Reject bad transcriptions
            no_speech_threshold=0.6,  # Detect silence
            condition_on_previous_text=False  # Prevent hallucination
        )
        
        # Adjust timestamps based on chunk start time
        if "segments" in result:
            for segment in result["segments"]:
                segment["start"] += chunk_info["start_time"]
                segment["end"] += chunk_info["start_time"]
        
        logger.info(f"✅ Chunk transcribed: {len(result.get('text', ''))} chars")
        
        # Clear GPU cache after processing
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
        gc.collect()
        
        return result
    except RuntimeError as e:
        if "out of memory" in str(e).lower():
            logger.error(f"❌ GPU out of memory on chunk {chunk_path}")
            if CUDA_AVAILABLE:
                torch.cuda.empty_cache()
            gc.collect()
        logger.error(f"❌ Runtime error transcribing chunk {chunk_path}: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Error transcribing chunk {chunk_path}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None


@app.get("/health")
async def health_check():
    """Health check endpoint with GPU info"""
    import psutil
    memory = psutil.virtual_memory()

    # Check service availability
    available = is_service_available()
    current_time = datetime.now(pytz.UTC)

    health_info = {
        "status": "healthy" if available else "service_unavailable",
        "service": "RunPod GPU AI Service",
        "service_available": available,
        "availability_schedule": {
            "days": "Monday-Saturday",
            "hours": "6:45 PM Pakistan Time to 6:00 AM Pacific Time",
            "timezone_info": {
                "pkt": "Asia/Karachi (UTC+5)",
                "pst": "US/Pacific (UTC-8)"
            }
        },
        "current_time_utc": current_time.isoformat(),
        "models_available": models_available,
        "device": DEVICE,
        "memory_usage": {
            "total_gb": round(memory.total / 1024**3, 2),
            "available_gb": round(memory.available / 1024**3, 2),
            "percent": memory.percent,
        },
        "note": "Optimized for 30+ minute audio processing"
    }

    # Add GPU info if available
    if CUDA_AVAILABLE:
        health_info["gpu"] = {
            "name": GPU_NAME,
            "vram_total_gb": round(torch.cuda.get_device_properties(0).total_memory / 1024**3, 2),
            "vram_allocated_gb": round(torch.cuda.memory_allocated(0) / 1024**3, 2),
            "vram_cached_gb": round(torch.cuda.memory_reserved(0) / 1024**3, 2),
        }

    return health_info


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribe audio file using Whisper on GPU
    Handles 30+ minute recordings with automatic chunking
    """
    temp_path = None
    chunk_files = []
    
    try:
        # Save uploaded file
        temp_path = f"/tmp/{uuid.uuid4()}_{audio.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        
        # Load Whisper model
        model = load_whisper_model()
        if model is None:
            raise HTTPException(status_code=503, detail="Whisper model failed to load")

        file_size_mb = os.path.getsize(temp_path) / (1024 * 1024)
        logger.info(f"🎙️ Processing audio: {audio.filename} ({file_size_mb:.2f} MB)")
        
        # Get audio duration
        import librosa
        duration = librosa.get_duration(path=temp_path)
        logger.info(f"⏱️  Duration: {duration:.1f}s ({duration/60:.1f} minutes)")
        
        # Process based on duration
        if duration > 600:  # 10+ minutes
            logger.info(f"📦 Long audio detected - using chunked processing")
            
            # Split into chunks
            chunks, total_duration = chunk_audio_file(temp_path, chunk_length_ms=600000)
            if not chunks:
                raise HTTPException(status_code=500, detail="Failed to chunk audio")
            
            chunk_files = [chunk["path"] for chunk in chunks]
            logger.info(f"✅ Split into {len(chunks)} chunks (10 min each)")
            
            # Process chunks in parallel
            import time
            start_time = time.time()
            
            loop = asyncio.get_event_loop()
            chunk_results = await asyncio.gather(*[
                loop.run_in_executor(executor, transcribe_chunk, model, chunk["path"], chunk)
                for chunk in chunks
            ])
            
            processing_time = time.time() - start_time
            logger.info(f"⚡ Parallel processing completed in {processing_time:.1f}s")
            
            # Merge results
            merged_text = []
            merged_segments = []
            detected_language = None
            
            for result in chunk_results:
                if result:
                    merged_text.append(result.get("text", "").strip())
                    if "segments" in result:
                        merged_segments.extend(result["segments"])
                    if not detected_language and "language" in result:
                        detected_language = result["language"]
            
            full_text = " ".join(merged_text)
            
            # Format timestamps
            timestamps = []
            for segment in merged_segments:
                timestamps.append({
                    "start": round(segment["start"], 2),
                    "end": round(segment["end"], 2),
                    "text": segment["text"].strip()
                })
            
            word_count = len(full_text.split()) if full_text else 0
            
            logger.info(f"✅ Transcription complete: {word_count} words, {len(timestamps)} segments")
            logger.info(f"🚀 Speed: {duration/processing_time:.1f}x realtime")
            
            return TranscribeResponse(
                text=full_text,
                timestamps=timestamps,
                language=detected_language,
                duration=total_duration,
                word_count=word_count
            )
        
        else:
            # Short audio - process directly
            logger.info("🎯 Processing directly (no chunking needed)")
            
            import time
            start_time = time.time()
            
            use_fp16 = CUDA_AVAILABLE
            result = model.transcribe(
                temp_path,
                verbose=False,
                fp16=use_fp16,
                language=None
            )
            
            processing_time = time.time() - start_time
            logger.info(f"⚡ Transcription completed in {processing_time:.1f}s")
            logger.info(f"🚀 Speed: {duration/processing_time:.1f}x realtime")
            
            text = result.get("text", "").strip()
            language = result.get("language")
            word_count = len(text.split()) if text else 0
            
            timestamps = []
            if "segments" in result:
                for segment in result["segments"]:
                    timestamps.append({
                        "start": round(segment["start"], 2),
                        "end": round(segment["end"], 2),
                        "text": segment["text"].strip()
                    })
            
            logger.info(f"✅ Complete: {word_count} words, {len(timestamps)} segments")
            
            return TranscribeResponse(
                text=text,
                timestamps=timestamps,
                language=language,
                duration=duration,
                word_count=word_count
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Transcription error: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    finally:
        # Cleanup with retry logic
        import gc
        import time
        
        cleanup_errors = []
        
        if temp_path and os.path.exists(temp_path):
            for attempt in range(3):
                try:
                    os.unlink(temp_path)
                    break
                except Exception as e:
                    if attempt < 2:
                        time.sleep(0.1)
                    else:
                        cleanup_errors.append(f"Failed to delete {temp_path}: {e}")
        
        for chunk_file in chunk_files:
            if os.path.exists(chunk_file):
                for attempt in range(3):
                    try:
                        os.unlink(chunk_file)
                        break
                    except Exception as e:
                        if attempt < 2:
                            time.sleep(0.1)
                        else:
                            cleanup_errors.append(f"Failed to delete {chunk_file}: {e}")
        
        if cleanup_errors:
            logger.warning(f"Cleanup warnings: {'; '.join(cleanup_errors)}")
        
        # Clear GPU memory
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
        
        # Force garbage collection
        gc.collect()


@app.post("/analyze-sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment using GPU-accelerated DistilBERT"""
    import gc
    try:
        analyzer = load_sentiment_model()
        if analyzer is None:
            raise HTTPException(status_code=503, detail="Sentiment analyzer failed to load")

        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        # For very long text, analyze in chunks and aggregate
        max_chunk_chars = 2000
        
        if len(request.text) > max_chunk_chars:
            logger.info(f"🔍 Long text detected ({len(request.text)} chars), analyzing in chunks")
            
            # Split into chunks (by sentences to avoid cutting mid-sentence)
            chunks = []
            current_chunk = ""
            sentences = request.text.split('. ')
            
            for sentence in sentences:
                if len(current_chunk) + len(sentence) < max_chunk_chars:
                    current_chunk += sentence + ". "
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence + ". "
            
            if current_chunk:
                chunks.append(current_chunk.strip())
            
            # Analyze each chunk
            positive_scores = []
            negative_scores = []
            
            for i, chunk in enumerate(chunks[:10]):  # Limit to 10 chunks
                try:
                    result = analyzer(chunk, truncation=True, max_length=512)[0]
                    if result["label"].upper() == "POSITIVE":
                        positive_scores.append(result["score"])
                    else:
                        negative_scores.append(result["score"])
                except Exception as e:
                    logger.warning(f"Failed to analyze chunk {i}: {e}")
            
            # Aggregate results
            if len(positive_scores) > len(negative_scores):
                label = "positive"
                score = sum(positive_scores) / len(positive_scores) if positive_scores else 0.5
            elif len(negative_scores) > len(positive_scores):
                label = "negative"
                score = sum(negative_scores) / len(negative_scores) if negative_scores else 0.5
            else:
                label = "neutral"
                score = 0.5
        else:
            text = request.text[:max_chunk_chars]
            logger.info(f"🔍 Analyzing sentiment: {len(text)} chars")
            result = analyzer(text, truncation=True, max_length=512)[0]
            
            label_map = {
                "POSITIVE": "positive",
                "NEGATIVE": "negative",
                "NEUTRAL": "neutral"
            }
            
            label = label_map.get(result["label"].upper(), result["label"].lower())
            score = result["score"]
        
        if score >= 0.9:
            confidence = "very high"
        elif score >= 0.75:
            confidence = "high"
        elif score >= 0.6:
            confidence = "moderate"
        else:
            confidence = "low"
        
        logger.info(f"✅ Sentiment: {label} ({score:.2f})")
        
        # Clear memory
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
        gc.collect()
        
        return SentimentResponse(
            label=label,
            score=round(score, 4),
            confidence=confidence
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Sentiment error: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")


@app.post("/extract-entities", response_model=EntityResponse)
async def extract_entities(request: EntityRequest):
    """Extract entities using spaCy with improved long-text handling"""
    import gc
    try:
        nlp = load_spacy_model()
        if nlp is None:
            raise HTTPException(
                status_code=503,
                detail="spaCy model not loaded. Run: python -m spacy download en_core_web_sm"
            )

        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        logger.info(f"🔍 Extracting entities: {len(request.text)} chars")
        
        # Process in chunks for very long text to avoid memory issues
        max_text_length = 100000
        text = request.text[:max_text_length]
        
        if len(request.text) > max_text_length:
            logger.warning(f"Text truncated from {len(request.text)} to {max_text_length} chars")
        
        try:
            # Disable unnecessary components for speed
            with nlp.select_pipes(enable=["tok2vec", "tagger", "parser", "ner"]):
                doc = nlp(text)
        except Exception as e:
            logger.error(f"spaCy processing failed: {e}")
            # Fallback: process smaller chunk
            text = request.text[:50000]
            doc = nlp(text)
        
        entities = []
        seen_entities = set()  # Deduplicate entities
        
        for ent in doc.ents:
            entity_key = f"{ent.text}_{ent.label_}"
            if entity_key not in seen_entities:
                entities.append({
                    "text": ent.text,
                    "label": ent.label_,
                    "start": ent.start_char,
                    "end": ent.end_char
                })
                seen_entities.add(entity_key)
        
        # Extract key phrases (limit to avoid excessive data)
        key_phrases = []
        seen_phrases = set()
        
        for chunk in doc.noun_chunks:
            phrase = chunk.text.strip()
            if phrase and phrase not in seen_phrases and len(phrase) > 2:
                key_phrases.append(phrase)
                seen_phrases.add(phrase)
                
                if len(key_phrases) >= 50:  # Limit key phrases
                    break
        
        logger.info(f"✅ Found {len(entities)} entities, {len(key_phrases)} phrases")
        
        # Clear memory
        del doc
        gc.collect()
        
        return EntityResponse(
            entities=entities,
            key_phrases=key_phrases
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Entity extraction error: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Entity extraction failed: {str(e)}")


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest):
    """Summarize text using GPU-accelerated BART with improved long-text handling"""
    import gc
    try:
        summarizer = load_summarizer_model()
        if summarizer is None:
            raise HTTPException(status_code=503, detail="Summarizer failed to load")

        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        # Minimum text length for summarization
        if len(request.text.split()) < 50:
            logger.info("Text too short, returning as is")
            return SummarizeResponse(summary=request.text)

        logger.info(f"📄 Summarizing: {len(request.text)} chars, {len(request.text.split())} words")

        max_chunk_size = 3000
        max_chunks = 20  # Limit to prevent excessive processing
        
        if len(request.text) > max_chunk_size:
            # Hierarchical summarization for long text
            # Split by sentences to avoid cutting mid-sentence
            sentences = request.text.replace('? ', '?|').replace('! ', '!|').replace('. ', '.|').split('|')
            
            chunks = []
            current_chunk = ""
            
            for sentence in sentences:
                if len(current_chunk) + len(sentence) < max_chunk_size:
                    current_chunk += sentence + " "
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence + " "
                    
                    # Limit number of chunks
                    if len(chunks) >= max_chunks:
                        logger.warning(f"Reached max chunks ({max_chunks}), truncating")
                        break
            
            if current_chunk and len(chunks) < max_chunks:
                chunks.append(current_chunk.strip())
            
            logger.info(f"📦 Processing {len(chunks)} chunks")
            
            chunk_summaries = []
            for i, chunk in enumerate(chunks):
                try:
                    # Adjust max_length based on chunk size
                    chunk_words = len(chunk.split())
                    chunk_max_length = min(150, max(40, chunk_words // 4))
                    
                    result = summarizer(
                        chunk, 
                        max_length=chunk_max_length, 
                        min_length=30, 
                        do_sample=False,
                        truncation=True
                    )
                    chunk_summaries.append(result[0]["summary_text"])
                    
                    # Clear GPU cache periodically
                    if CUDA_AVAILABLE and i % 5 == 0:
                        torch.cuda.empty_cache()
                        
                except Exception as e:
                    logger.warning(f"Chunk {i} summarization failed: {e}")
                    continue
            
            if not chunk_summaries:
                raise HTTPException(status_code=500, detail="Failed to summarize any chunks")
            
            # Final summary
            combined = " ".join(chunk_summaries)
            logger.info(f"📋 Combined summaries: {len(combined)} chars")
            
            try:
                if len(combined) > max_chunk_size:
                    final_result = summarizer(
                        combined[:max_chunk_size],
                        max_length=request.max_length,
                        min_length=request.min_length,
                        do_sample=False,
                        truncation=True
                    )
                else:
                    final_result = summarizer(
                        combined,
                        max_length=request.max_length,
                        min_length=request.min_length,
                        do_sample=False,
                        truncation=True
                    )
                
                summary = final_result[0]["summary_text"]
            except Exception as e:
                logger.warning(f"Final summarization failed, using combined chunk summaries: {e}")
                # Fallback: return truncated combined summaries
                summary = combined[:1000] + "..." if len(combined) > 1000 else combined
        else:
            result = summarizer(
                request.text,
                max_length=request.max_length,
                min_length=request.min_length,
                do_sample=False,
                truncation=True
            )
            summary = result[0]["summary_text"]
        
        logger.info(f"✅ Summary: {len(summary)} chars")
        
        # Clear memory
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
        gc.collect()
        
        return SummarizeResponse(summary=summary)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Summarization error: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@app.post("/check-compliance", response_model=ComplianceCheckResponse)
async def check_compliance(request: ComplianceCheckRequest):
    """Check compliance using rapidfuzz"""
    try:
        from rapidfuzz import fuzz
        
        transcript_lower = request.transcript.lower()
        
        logger.info(f"🔍 Compliance check: {len(request.mandatory_phrases)} mandatory, {len(request.forbidden_phrases)} forbidden")
        
        missing_mandatory = []
        detected_forbidden = []
        
        # Check mandatory phrases
        for phrase in request.mandatory_phrases:
            phrase_lower = phrase.lower()
            
            if phrase_lower in transcript_lower:
                continue
            
            # Fuzzy matching
            best_match = 0
            words = transcript_lower.split()
            phrase_words = phrase_lower.split()
            n = len(phrase_words)
            
            for i in range(len(words) - n + 1):
                ngram = " ".join(words[i:i+n])
                ratio = fuzz.ratio(phrase_lower, ngram)
                if ratio > best_match:
                    best_match = ratio
            
            if best_match < request.fuzzy_threshold:
                missing_mandatory.append(phrase)
        
        # Check forbidden phrases
        for phrase in request.forbidden_phrases:
            phrase_lower = phrase.lower()
            
            if phrase_lower in transcript_lower:
                detected_forbidden.append(phrase)
                continue
            
            words = transcript_lower.split()
            phrase_words = phrase_lower.split()
            n = len(phrase_words)
            
            for i in range(len(words) - n + 1):
                ngram = " ".join(words[i:i+n])
                ratio = fuzz.ratio(phrase_lower, ngram)
                if ratio >= request.fuzzy_threshold:
                    detected_forbidden.append(phrase)
                    break
        
        # Calculate score
        total_mandatory = len(request.mandatory_phrases)
        
        if total_mandatory > 0:
            mandatory_score = ((total_mandatory - len(missing_mandatory)) / total_mandatory) * 100
        else:
            mandatory_score = 100
        
        forbidden_penalty = len(detected_forbidden) * 20
        compliance_score = max(0, mandatory_score - forbidden_penalty)
        
        logger.info(f"✅ Compliance: {compliance_score:.1f}%")
        
        return ComplianceCheckResponse(
            missing_mandatory=missing_mandatory,
            detected_forbidden=detected_forbidden,
            compliance_score=round(compliance_score, 2),
            details={
                "total_mandatory": total_mandatory,
                "found_mandatory": total_mandatory - len(missing_mandatory),
                "total_forbidden": len(request.forbidden_phrases),
                "violations": len(detected_forbidden),
                "mandatory_score": round(mandatory_score, 2),
                "forbidden_penalty": forbidden_penalty
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Compliance error: {e}")
        raise HTTPException(status_code=500, detail=f"Compliance check failed: {str(e)}")


class QualityScoreRequest(BaseModel):
    transcript: str
    speaker_labeled_transcript: Optional[str] = None
    detected_language: str = "english"


class QualityDetails(BaseModel):
    customer_tone: str
    detected_language: str
    agent_casual_phrases: List[str]
    customer_style: str
    abusive_words_found: List[str]
    dnc_phrases_found: List[str]


class QualityScoreResponse(BaseModel):
    overall_score: float
    factors: Dict[str, float]
    details: QualityDetails
    flags: Dict[str, bool]


@app.post("/calculate-quality-score", response_model=QualityScoreResponse)
async def calculate_quality_score(request: QualityScoreRequest):
    """
    Calculate AI-based quality score using 6 business factors:
    1. Customer tone (25 pts) - sentiment analysis on customer speech
    2. Language selection (10 pts) - English=10, Spanish/French/German=8, other=5
    3. Agent professionalism (25 pts) - detects casual phrases
    4. Customer communication (20 pts) - polite/neutral/assertive/aggressive
    5. Abusive language (-30 pts max) - profanity detection
    6. DNC detection (-20 pts) - Precise detection of explicit DNC requests from customers only
    """
    try:
        logger.info("🔍 Starting AI quality scoring")
        
        transcript_lower = request.transcript.lower()
        
        # Initialize scores
        factors = {
            "customer_tone_score": 0.0,
            "language_score": 0.0,
            "agent_professionalism_score": 0.0,
            "customer_communication_score": 0.0,
            "abusive_language_penalty": 0.0,
            "dnc_penalty": 0.0
        }
        
        details = {
            "customer_tone": "neutral",
            "detected_language": request.detected_language.lower(),
            "agent_casual_phrases": [],
            "customer_style": "neutral",
            "abusive_words_found": [],
            "dnc_phrases_found": []
        }
        
        flags = {
            "has_abusive_language": False,
            "is_dnc_customer": False,
            "agent_too_casual": False,
            "customer_frustrated": False
        }
        
        # Factor 1: Customer Tone (25 points) - Sentiment analysis
        if request.speaker_labeled_transcript:
            # Extract customer lines only (assuming speaker 1 is agent, speaker 2 is customer)
            customer_lines = [line for line in request.speaker_labeled_transcript.split('\n') 
                            if line.strip().startswith('[Speaker 2]')]
            customer_text = ' '.join([line.split(']', 1)[1].strip() if ']' in line else '' 
                                     for line in customer_lines])
            
            if customer_text and len(customer_text) > 10:
                try:
                    # Use sentiment analyzer
                    sentiment_result = sentiment_analyzer(customer_text[:512])[0]
                    sentiment_label = sentiment_result['label']
                    
                    if sentiment_label == 'POSITIVE':
                        factors["customer_tone_score"] = 25.0
                        details["customer_tone"] = "positive"
                    elif sentiment_label == 'NEGATIVE':
                        factors["customer_tone_score"] = 10.0
                        details["customer_tone"] = "frustrated"
                        flags["customer_frustrated"] = True
                    else:
                        factors["customer_tone_score"] = 18.0
                        details["customer_tone"] = "neutral"
                except Exception as e:
                    logger.warning(f"Sentiment analysis failed: {e}")
                    factors["customer_tone_score"] = 18.0
        else:
            # Fallback to whole transcript sentiment
            factors["customer_tone_score"] = 18.0
        
        # Factor 2: Language Selection (10 points)
        language_scores = {
            "english": 10.0,
            "spanish": 8.0,
            "french": 8.0,
            "german": 8.0
        }
        factors["language_score"] = language_scores.get(details["detected_language"], 5.0)
        
        # Factor 3: Agent Professionalism (25 points) - Detect casual language
        casual_phrases = [
            "yeah", "yep", "nope", "gonna", "wanna", "gotta", "kinda", "sorta",
            "umm", "uh", "like i said", "you know", "basically", "actually"
        ]
        
        found_casual = []
        for phrase in casual_phrases:
            if phrase in transcript_lower:
                found_casual.append(phrase)
        
        details["agent_casual_phrases"] = found_casual
        
        # Deduct 2 points per casual phrase (max 15 points penalty)
        penalty = min(len(found_casual) * 2, 15)
        factors["agent_professionalism_score"] = 25.0 - penalty
        
        if len(found_casual) >= 3:
            flags["agent_too_casual"] = True
        
        # Factor 4: Customer Communication Style (20 points)
        polite_words = ["please", "thank you", "thanks", "appreciate", "grateful"]
        aggressive_words = ["ridiculous", "unacceptable", "terrible", "awful", "horrible", "disgusting"]
        
        polite_count = sum(1 for word in polite_words if word in transcript_lower)
        aggressive_count = sum(1 for word in aggressive_words if word in transcript_lower)
        
        if aggressive_count >= 2:
            factors["customer_communication_score"] = 8.0
            details["customer_style"] = "aggressive"
        elif aggressive_count == 1:
            factors["customer_communication_score"] = 12.0
            details["customer_style"] = "assertive"
        elif polite_count >= 2:
            factors["customer_communication_score"] = 20.0
            details["customer_style"] = "polite"
        else:
            factors["customer_communication_score"] = 16.0
            details["customer_style"] = "neutral"
        
        # Factor 5: Abusive Language Detection (-30 pts max)
        abusive_words = [
            "fuck", "shit", "damn", "hell", "ass", "bitch", "bastard", "crap",
            "stupid", "idiot", "moron", "dumb", "screw you"
        ]

        found_abusive = []
        # Split transcript into words for better matching
        words = re.findall(r'\b\w+\b', transcript_lower)

        for word in words:
            if word in abusive_words:
                found_abusive.append(word)
        
        if found_abusive:
            details["abusive_words_found"] = found_abusive
            flags["has_abusive_language"] = True
            # -10 points per abusive word, max -30
            factors["abusive_language_penalty"] = -min(len(found_abusive) * 10, 30)
        
        # Factor 6: DNC Detection (-20 pts) - More precise detection
        # Only flag as DNC if customer clearly expresses they don't want future calls
        dnc_patterns = [
            # Direct requests to stop calling
            r"\b(?:please\s+)?(?:do\s+not|don't)\s+call\s+(?:me|us|this\s+number)\s+again\b",
            r"\b(?:please\s+)?stop\s+calling\s+(?:me|us|this\s+number)\b",
            r"\b(?:please\s+)?remove\s+(?:me|my\s+number|this\s+number)\s+from\s+your\s+(?:list|call\s+list)\b",
            r"\b(?:please\s+)?take\s+(?:me|my\s+number|this\s+number)\s+off\s+(?:your\s+)?(?:call\s+)?list\b",
            r"\bi\s+(?:do\s+not|don't)\s+want\s+(?:any\s+more|further|additional)\s+calls\b",
            r"\bnever\s+call\s+(?:me|us|this\s+number)\s+again\b",
            r"\bno\s+more\s+calls\b",
            r"\bi\s+am\s+not\s+interested\s+in\s+(?:your\s+)?services?\b",
            # Explicit DNC requests
            r"\bput\s+me\s+on\s+(?:your\s+)?do\s+not\s+call\s+list\b",
            r"\badd\s+(?:me|this\s+number)\s+to\s+(?:your\s+)?do\s+not\s+call\s+list\b"
        ]

        found_dnc = []
        # Check customer speech only (Speaker 2) if available
        if request.speaker_labeled_transcript:
            customer_lines = [line for line in request.speaker_labeled_transcript.split('\n')
                            if line.strip().startswith('[Speaker 2]')]
            customer_text = ' '.join([line.split(']', 1)[1].strip() if ']' in line else ''
                                     for line in customer_lines])
            text_to_check = customer_text.lower()
        else:
            # Fallback to full transcript if no speaker labels
            text_to_check = transcript_lower

        for pattern in dnc_patterns:
            if re.search(pattern, text_to_check, re.IGNORECASE):
                found_dnc.append(pattern)

        # Additional check: exclude procedural phrases that might contain "do not call"
        procedural_exclusions = [
            r"do\s+not\s+call\s+it",  # "do not call it" in procedural context
            r"do\s+not\s+call\s+back",  # "do not call back" as instruction
            r"do\s+not\s+call\s+me\s+yet",  # temporary hold
            r"do\s+not\s+call\s+until",  # conditional
            r"stay\s+on\s+line",  # procedural instruction
            r"bear\s+with\s+me",  # procedural instruction
            r"let\s+me\s+connect",  # procedural instruction
        ]

        # Remove false positives
        filtered_dnc = []
        for pattern in found_dnc:
            is_false_positive = False
            for exclusion in procedural_exclusions:
                if re.search(exclusion, text_to_check, re.IGNORECASE):
                    is_false_positive = True
                    break
            if not is_false_positive:
                filtered_dnc.append(pattern)

        if filtered_dnc:
            details["dnc_phrases_found"] = filtered_dnc
            flags["is_dnc_customer"] = True
            factors["dnc_penalty"] = -20.0
        
        # Calculate overall score (0-100 scale)
        overall_score = sum(factors.values())
        overall_score = max(0, min(100, overall_score))  # Clamp to 0-100
        
        logger.info(f"✅ AI Quality Score: {overall_score:.1f}/100")
        
        return QualityScoreResponse(
            overall_score=round(overall_score, 2),
            factors=factors,
            details=QualityDetails(
                customer_tone=details["customer_tone"],
                detected_language=details["detected_language"],
                agent_casual_phrases=details["agent_casual_phrases"],
                customer_style=details["customer_style"],
                abusive_words_found=details["abusive_words_found"],
                dnc_phrases_found=details["dnc_phrases_found"]
            ),
            flags=flags
        )
        
    except Exception as e:
        logger.error(f"❌ Quality scoring error: {e}")
        raise HTTPException(status_code=500, detail=f"Quality scoring failed: {str(e)}")


def load_diarization_model():
    """Lazy load pyannote diarization model with GPU support"""
    global diarization_pipeline, models_available
    if diarization_pipeline is not None:
        return diarization_pipeline

    try:
        from pyannote.audio import Pipeline
        
        # Requires HuggingFace token for pyannote models
        hf_token = os.getenv("HUGGINGFACE_TOKEN")
        if not hf_token:
            logger.warning("⚠️ HUGGINGFACE_TOKEN not set - diarization will fail")
            logger.warning("Get token from: https://huggingface.co/settings/tokens")
            return None
        
        logger.info("Loading diarization model...")
        diarization_pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=hf_token
        )
        
        # Move to GPU if available
        if CUDA_AVAILABLE:
            diarization_pipeline.to(torch.device("cuda"))
            logger.info("✅ Diarization model loaded on GPU")
        else:
            logger.info("✅ Diarization model loaded on CPU")
        
        models_available["diarization"] = True
        return diarization_pipeline
    except Exception as e:
        logger.error(f"❌ Failed to load diarization model: {e}")
        models_available["diarization"] = False
        return None


@app.post("/diarize", response_model=DiarizeResponse)
async def diarize_audio(
    audio: UploadFile = File(...),
    min_speakers: int = Form(2),
    max_speakers: int = Form(2)
):
    """
    Perform speaker diarization on audio file
    Returns speaker segments with timestamps
    Handles long audio files with proper memory management
    """
    temp_audio_path = None
    import gc
    
    try:
        logger.info(f"🎙️ Diarization request: {audio.filename}")
        
        # Load diarization model
        pipeline = load_diarization_model()
        if pipeline is None:
            raise HTTPException(
                status_code=503,
                detail="Diarization model not available. Please set HUGGINGFACE_TOKEN environment variable."
            )
        
        # Save uploaded file temporarily
        temp_audio_path = f"/tmp/{uuid.uuid4()}_{audio.filename}"
        with open(temp_audio_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)
        
        # Check file size
        file_size_mb = os.path.getsize(temp_audio_path) / (1024 * 1024)
        logger.info(f"Audio file size: {file_size_mb:.2f} MB")
        
        if file_size_mb > 100:  # Warn for very large files
            logger.warning(f"Large audio file ({file_size_mb:.2f} MB) - diarization may take time")
        
        # Validate speaker range
        if min_speakers < 1:
            min_speakers = 1
        if max_speakers < min_speakers:
            max_speakers = min_speakers
        if max_speakers > 10:  # Reasonable limit
            logger.warning(f"max_speakers={max_speakers} is high, limiting to 10")
            max_speakers = 10
        
        logger.info(f"Processing diarization with {min_speakers}-{max_speakers} speakers...")
        
        # Clear GPU cache before processing
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
        
        # Run diarization with timeout handling
        diarization = pipeline(
            temp_audio_path,
            min_speakers=min_speakers,
            max_speakers=max_speakers
        )
        
        # Convert to serializable format
        speaker_segments = []
        speakers = set()
        
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            speakers.add(speaker)
            speaker_segments.append({
                "speaker": speaker,
                "start": round(float(turn.start), 2),
                "end": round(float(turn.end), 2),
                "duration": round(float(turn.end - turn.start), 2)
            })
        
        # Sort segments by start time
        speaker_segments.sort(key=lambda x: x["start"])
        
        logger.info(f"✅ Diarization complete: {len(speakers)} speakers, {len(speaker_segments)} segments")
        
        # Clear GPU memory
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
        gc.collect()
        
        return DiarizeResponse(
            speaker_segments=speaker_segments,
            speakers=sorted(list(speakers)),
            num_speakers=len(speakers)
        )
        
    except RuntimeError as e:
        if "out of memory" in str(e).lower():
            logger.error(f"❌ GPU out of memory during diarization")
            if CUDA_AVAILABLE:
                torch.cuda.empty_cache()
            raise HTTPException(status_code=500, detail="GPU out of memory. Try with shorter audio.")
        logger.error(f"❌ Diarization runtime error: {e}")
        raise HTTPException(status_code=500, detail=f"Diarization failed: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Diarization error: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Diarization failed: {str(e)}")
    finally:
        # Clean up temp file with retry
        if temp_audio_path and os.path.exists(temp_audio_path):
            import time
            for attempt in range(3):
                try:
                    os.remove(temp_audio_path)
                    break
                except Exception as e:
                    if attempt < 2:
                        time.sleep(0.1)
                    else:
                        logger.warning(f"Failed to cleanup temp file: {e}")
        
        # Clear memory
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
        gc.collect()


@app.post("/transcribe-with-speakers", response_model=TranscribeWithSpeakersResponse)
async def transcribe_with_speakers(
    audio: UploadFile = File(...),
    min_speakers: int = Form(2),
    max_speakers: int = Form(2)
):
    """
    Combined endpoint: Transcribe audio with speaker diarization
    Returns transcript with speaker labels (Agent/Customer)
    """
    temp_audio_path = None
    import gc
    
    try:
        logger.info(f"🎯 Transcribe-with-speakers request: {audio.filename}")
        
        # Save uploaded file
        temp_audio_path = f"/tmp/{uuid.uuid4()}_{audio.filename}"
        with open(temp_audio_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)
        
        file_size_mb = os.path.getsize(temp_audio_path) / (1024 * 1024)
        logger.info(f"Audio file size: {file_size_mb:.2f} MB")
        
        # Step 1: Transcribe with word-level timestamps
        logger.info("Step 1/3: Transcribing audio with word timestamps...")
        whisper_model = load_whisper_model()
        if whisper_model is None:
            raise HTTPException(status_code=503, detail="Whisper model failed to load")
        
        use_fp16 = CUDA_AVAILABLE
        result = whisper_model.transcribe(
            temp_audio_path,
            verbose=False,
            fp16=use_fp16,
            language=None,
            word_timestamps=True  # Enable word-level timestamps
        )
        
        full_text = result.get("text", "").strip()
        language = result.get("language")
        segments = result.get("segments", [])
        
        # Extract word-level timestamps
        words_with_timestamps = []
        for segment in segments:
            if "words" in segment:
                for word_info in segment["words"]:
                    words_with_timestamps.append({
                        "word": word_info.get("word", "").strip(),
                        "start": word_info.get("start", 0),
                        "end": word_info.get("end", 0)
                    })
        
        logger.info(f"✅ Transcription complete: {len(words_with_timestamps)} words")
        
        # Step 2: Speaker diarization
        logger.info("Step 2/3: Performing speaker diarization...")
        diarization_pipeline = load_diarization_model()
        if diarization_pipeline is None:
            raise HTTPException(status_code=503, detail="Diarization model not available")
        
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
        
        diarization = diarization_pipeline(
            temp_audio_path,
            min_speakers=min_speakers,
            max_speakers=max_speakers
        )
        
        # Extract speaker segments
        speaker_segments = []
        speakers = set()
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            speakers.add(speaker)
            speaker_segments.append({
                "speaker": speaker,
                "start": round(float(turn.start), 2),
                "end": round(float(turn.end), 2),
                "duration": round(float(turn.end - turn.start), 2)
            })
        
        speaker_segments.sort(key=lambda x: x["start"])
        logger.info(f"✅ Diarization complete: {len(speakers)} speakers, {len(speaker_segments)} segments")
        
        # Step 3: Merge transcription with speaker labels
        logger.info("Step 3/3: Merging transcript with speaker labels...")
        
        def find_speaker_at_time(timestamp, speaker_segs):
            """Find which speaker is talking at a given timestamp"""
            for seg in speaker_segs:
                if seg["start"] <= timestamp <= seg["end"]:
                    return seg["speaker"]
            # If no exact match, find closest segment
            closest = min(speaker_segs, key=lambda x: abs(x["start"] - timestamp))
            return closest["speaker"]
        
        # Map speakers to Agent/Customer
        # Assumption: First speaker (alphabetically) is Agent, second is Customer
        sorted_speakers = sorted(list(speakers))
        speaker_labels = {}
        if len(sorted_speakers) >= 2:
            speaker_labels[sorted_speakers[0]] = "Agent"
            speaker_labels[sorted_speakers[1]] = "Customer"
            # Additional speakers get numbered labels
            for i, speaker in enumerate(sorted_speakers[2:], start=3):
                speaker_labels[speaker] = f"Speaker {i}"
        elif len(sorted_speakers) == 1:
            speaker_labels[sorted_speakers[0]] = "Speaker"
        
        # Build speaker-labeled transcript
        labeled_segments = []
        current_speaker = None
        current_text = []
        
        for segment in segments:
            # Use segment midpoint to determine speaker
            midpoint = (segment["start"] + segment["end"]) / 2
            segment_speaker = find_speaker_at_time(midpoint, speaker_segments)
            segment_label = speaker_labels.get(segment_speaker, segment_speaker)
            segment_text = segment["text"].strip()
            
            if segment_speaker != current_speaker:
                # Speaker changed, save previous segment
                if current_speaker and current_text:
                    labeled_segments.append({
                        "speaker": speaker_labels.get(current_speaker, current_speaker),
                        "text": " ".join(current_text).strip()
                    })
                current_speaker = segment_speaker
                current_text = [segment_text]
            else:
                # Same speaker, accumulate text
                current_text.append(segment_text)
        
        # Add final segment
        if current_speaker and current_text:
            labeled_segments.append({
                "speaker": speaker_labels.get(current_speaker, current_speaker),
                "text": " ".join(current_text).strip()
            })
        
        # Format as readable text
        speaker_labeled_text = "\n\n".join([
            f"{seg['speaker']}: {seg['text']}"
            for seg in labeled_segments
        ])
        
        logger.info(f"✅ Speaker-labeled transcript created: {len(labeled_segments)} turns")
        
        # Get duration
        import librosa
        duration = librosa.get_duration(path=temp_audio_path)
        
        # Format timestamps
        timestamps = []
        for segment in segments:
            timestamps.append({
                "start": round(segment["start"], 2),
                "end": round(segment["end"], 2),
                "text": segment["text"].strip()
            })
        
        word_count = len(full_text.split()) if full_text else 0
        
        # Clear GPU memory
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
        gc.collect()
        
        return TranscribeWithSpeakersResponse(
            text=full_text,
            speaker_labeled_text=speaker_labeled_text,
            timestamps=timestamps,
            speaker_segments=speaker_segments,
            speakers=sorted_speakers,
            language=language,
            duration=duration,
            word_count=word_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Transcribe-with-speakers error: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to transcribe with speakers: {str(e)}")
    finally:
        # Cleanup
        if temp_audio_path and os.path.exists(temp_audio_path):
            import time
            for attempt in range(3):
                try:
                    os.remove(temp_audio_path)
                    break
                except Exception as e:
                    if attempt < 2:
                        time.sleep(0.1)
                    else:
                        logger.warning(f"Failed to cleanup temp file: {e}")
        
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
        gc.collect()


@app.post("/calculate-talk-time", response_model=TalkTimeResponse)
async def calculate_talk_time(
    audio: UploadFile = File(...),
    speaker_segments: str = Form(...)  # JSON string of speaker segments
):
    """
    Calculate talk-time metrics from diarization results
    Returns agent/customer talk time, ratio, and dead air detection
    Handles edge cases for long calls
    """
    import json
    import gc
    temp_audio_path = None
    
    try:
        logger.info(f"📊 Talk-time calculation request: {audio.filename}")
        
        # Parse speaker segments with validation
        try:
            segments = json.loads(speaker_segments)
            if not isinstance(segments, list):
                raise ValueError("speaker_segments must be a list")
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON in speaker_segments: {e}")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        if not segments:
            raise HTTPException(status_code=400, detail="No speaker segments provided")
        
        # Get audio duration
        temp_audio_path = f"/tmp/{uuid.uuid4()}_{audio.filename}"
        with open(temp_audio_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)
        
        try:
            from pydub import AudioSegment
            audio_file = AudioSegment.from_file(temp_audio_path)
            total_duration = len(audio_file) / 1000.0  # Convert to seconds
            del audio_file  # Free memory
        except Exception as e:
            logger.warning(f"Could not determine audio duration: {e}")
            # Fallback: use last segment end time
            total_duration = max([seg.get("end", 0) for seg in segments], default=0)
        
        logger.info(f"Total duration: {total_duration:.2f}s")
        
        # Validate segments
        valid_segments = []
        for seg in segments:
            if all(k in seg for k in ["speaker", "start", "end"]):
                # Ensure numeric values
                try:
                    seg["start"] = float(seg["start"])
                    seg["end"] = float(seg["end"])
                    seg["duration"] = seg["end"] - seg["start"]
                    
                    # Validate segment
                    if seg["duration"] > 0 and seg["start"] >= 0:
                        valid_segments.append(seg)
                except (ValueError, TypeError) as e:
                    logger.warning(f"Invalid segment skipped: {seg}, error: {e}")
        
        if not valid_segments:
            raise HTTPException(status_code=400, detail="No valid speaker segments found")
        
        logger.info(f"Valid segments: {len(valid_segments)}/{len(segments)}")
        
        # Calculate talk time per speaker
        speaker_talk_time = {}
        for segment in valid_segments:
            speaker = segment["speaker"]
            duration = segment["duration"]
            speaker_talk_time[speaker] = speaker_talk_time.get(speaker, 0) + duration
        
        # Calculate dead air (gaps between segments)
        sorted_segments = sorted(valid_segments, key=lambda x: x["start"])
        dead_air_segments = []
        dead_air_total = 0
        dead_air_threshold = 2.0  # seconds
        
        for i in range(len(sorted_segments) - 1):
            current_end = sorted_segments[i]["end"]
            next_start = sorted_segments[i + 1]["start"]
            gap = next_start - current_end
            
            # Only count gaps above threshold
            if gap > dead_air_threshold:
                dead_air_segments.append({
                    "start": round(current_end, 2),
                    "end": round(next_start, 2),
                    "duration": round(gap, 2)
                })
                dead_air_total += gap
        
        # Check for dead air at beginning and end
        if sorted_segments:
            # Dead air at start
            if sorted_segments[0]["start"] > dead_air_threshold:
                dead_air_segments.insert(0, {
                    "start": 0,
                    "end": round(sorted_segments[0]["start"], 2),
                    "duration": round(sorted_segments[0]["start"], 2)
                })
                dead_air_total += sorted_segments[0]["start"]
            
            # Dead air at end
            last_end = sorted_segments[-1]["end"]
            if total_duration - last_end > dead_air_threshold:
                dead_air_segments.append({
                    "start": round(last_end, 2),
                    "end": round(total_duration, 2),
                    "duration": round(total_duration - last_end, 2)
                })
                dead_air_total += (total_duration - last_end)
        
        # Calculate agent/customer ratio
        # Assume first speaker (alphabetically) is agent, second is customer
        speakers_list = sorted(speaker_talk_time.keys())
        
        if len(speakers_list) >= 2:
            agent_time = speaker_talk_time.get(speakers_list[0], 0)
            customer_time = speaker_talk_time.get(speakers_list[1], 0)
            
            if customer_time > 0:
                ratio = agent_time / customer_time
                ratio_str = f"{ratio:.2f}:1"
            else:
                ratio_str = "N/A (no customer speech)"
        elif len(speakers_list) == 1:
            ratio_str = "N/A (single speaker)"
        else:
            ratio_str = "N/A (no speakers)"
        
        logger.info(f"✅ Talk-time calculated: {len(speakers_list)} speakers, {dead_air_total:.1f}s dead air")
        
        # Clean up
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except:
                pass
        
        gc.collect()
        
        return TalkTimeResponse(
            speaker_talk_time={k: round(v, 2) for k, v in speaker_talk_time.items()},
            agent_customer_ratio=ratio_str,
            dead_air_total=round(dead_air_total, 2),
            dead_air_segments=dead_air_segments[:50],  # Limit to prevent excessive data
            total_duration=round(total_duration, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Talk-time calculation error: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Talk-time calculation failed: {str(e)}")
    finally:
        # Cleanup
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except:
                pass
        gc.collect()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Call Center - RunPod GPU Service",
        "version": "2.0.0",
        "gpu_enabled": CUDA_AVAILABLE,
        "gpu_name": GPU_NAME if CUDA_AVAILABLE else "N/A",
        "optimizations": [
            "GPU-accelerated Whisper transcription",
            "Chunked processing for 30+ minute audio",
            "Parallel chunk processing",
            "FP16 precision for 2x speed",
            "GPU-accelerated sentiment & summarization"
        ],
        "endpoints": {
            "health": "/health",
            "transcribe": "/transcribe",
            "transcribe_with_speakers": "/transcribe-with-speakers",
            "sentiment": "/analyze-sentiment",
            "entities": "/extract-entities",
            "summarize": "/summarize",
            "compliance": "/check-compliance",
            "diarize": "/diarize",
            "talk_time": "/calculate-talk-time"
        }
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🚀 RunPod GPU AI Service - Production Ready                ║
    ║                                                               ║
    ║   GPU: {GPU_NAME[:50].ljust(50)} ║
    ║   VRAM: {f"{VRAM_GB:.1f} GB" if CUDA_AVAILABLE else "N/A".ljust(55)} ║
    ║   Device: {DEVICE.upper().ljust(56)} ║
    ║                                                               ║
    ║   ✅ Whisper: {WHISPER_MODEL.ljust(48)} ║
    ║   ✅ Optimized for 30+ minute audio recordings               ║
    ║   ✅ Parallel chunk processing ({MAX_WORKERS} workers)                    ║
    ║   ✅ FP16 precision enabled                                  ║
    ║                                                               ║
    ║   Port: {str(port).ljust(58)} ║
    ║   Host: {host.ljust(58)} ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(app, host=host, port=port, log_level="info")