import os
import uvicorn
import uuid
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
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


def chunk_audio_file(audio_path: str, chunk_length_ms: int = 600000):
    """
    Split audio file into chunks for processing long recordings
    chunk_length_ms: chunk length in milliseconds (default 10 minutes)
    """
    try:
        from pydub import AudioSegment
        
        logger.info(f"📦 Chunking audio file: {audio_path}")
        audio = AudioSegment.from_file(audio_path)
        
        # Convert to mono to avoid channel mismatch issues
        if audio.channels > 1:
            audio = audio.set_channels(1)
            logger.info(f"✅ Converted to mono audio")
        
        duration_ms = len(audio)
        
        chunks = []
        for i in range(0, duration_ms, chunk_length_ms):
            chunk = audio[i:i + chunk_length_ms]
            chunk_path = f"{audio_path}_chunk_{i//chunk_length_ms}.wav"
            # Export as mono WAV with consistent sample rate
            chunk.export(chunk_path, format="wav", parameters=["-ac", "1", "-ar", "16000"])
            chunks.append({
                "path": chunk_path,
                "start_time": i / 1000,
                "end_time": min((i + chunk_length_ms) / 1000, duration_ms / 1000)
            })
        
        logger.info(f"✅ Created {len(chunks)} chunks")
        return chunks, duration_ms / 1000
    except Exception as e:
        logger.error(f"❌ Failed to chunk audio: {e}")
        return None, None


def transcribe_chunk(model, chunk_path, chunk_info):
    """Transcribe a single audio chunk with GPU acceleration"""
    try:
        logger.info(f"🎙️ Transcribing chunk: {os.path.basename(chunk_path)}")
        
        # Enable FP16 only on GPU for 2x speed boost
        use_fp16 = CUDA_AVAILABLE
        
        result = model.transcribe(
            chunk_path,
            verbose=False,
            fp16=use_fp16,  # FP16 for GPU, disabled for CPU
            language=None   # Auto-detect language
        )
        
        # Adjust timestamps based on chunk start time
        if "segments" in result:
            for segment in result["segments"]:
                segment["start"] += chunk_info["start_time"]
                segment["end"] += chunk_info["start_time"]
        
        logger.info(f"✅ Chunk transcribed: {len(result.get('text', ''))} chars")
        return result
    except Exception as e:
        logger.error(f"❌ Error transcribing chunk {chunk_path}: {e}")
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
        # Cleanup
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Cleanup warning: {e}")
        
        for chunk_file in chunk_files:
            if os.path.exists(chunk_file):
                try:
                    os.unlink(chunk_file)
                except Exception as e:
                    logger.warning(f"Cleanup warning: {e}")


@app.post("/analyze-sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment using GPU-accelerated DistilBERT"""
    try:
        analyzer = load_sentiment_model()
        if analyzer is None:
            raise HTTPException(status_code=503, detail="Sentiment analyzer failed to load")

        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        # Truncate for BERT (max 512 tokens)
        text = request.text[:2000]

        logger.info(f"🔍 Analyzing sentiment: {len(text)} chars")

        result = analyzer(text)[0]
        
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
        
        return SentimentResponse(
            label=label,
            score=round(score, 4),
            confidence=confidence
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Sentiment error: {e}")
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")


@app.post("/extract-entities", response_model=EntityResponse)
async def extract_entities(request: EntityRequest):
    """Extract entities using spaCy"""
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
        
        # Process in chunks for very long text
        text = request.text[:100000]
        doc = nlp(text)
        
        entities = []
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char
            })
        
        key_phrases = [chunk.text for chunk in doc.noun_chunks][:20]
        
        logger.info(f"✅ Found {len(entities)} entities, {len(key_phrases)} phrases")
        
        return EntityResponse(
            entities=entities,
            key_phrases=key_phrases
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Entity extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Entity extraction failed: {str(e)}")


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest):
    """Summarize text using GPU-accelerated BART"""
    try:
        summarizer = load_summarizer_model()
        if summarizer is None:
            raise HTTPException(status_code=503, detail="Summarizer failed to load")

        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        logger.info(f"📄 Summarizing: {len(request.text)} chars")

        max_chunk_size = 3000
        
        if len(request.text) > max_chunk_size:
            # Hierarchical summarization for long text
            chunks = [request.text[i:i+max_chunk_size] for i in range(0, len(request.text), max_chunk_size)]
            logger.info(f"📦 Processing {len(chunks)} chunks")
            
            chunk_summaries = []
            for i, chunk in enumerate(chunks):
                try:
                    result = summarizer(chunk, max_length=150, min_length=40, do_sample=False)
                    chunk_summaries.append(result[0]["summary_text"])
                except Exception as e:
                    logger.warning(f"Chunk {i} summarization failed: {e}")
            
            # Final summary
            combined = " ".join(chunk_summaries)
            if len(combined) > max_chunk_size:
                final_result = summarizer(
                    combined[:max_chunk_size],
                    max_length=request.max_length,
                    min_length=request.min_length,
                    do_sample=False
                )
            else:
                final_result = summarizer(
                    combined,
                    max_length=request.max_length,
                    min_length=request.min_length,
                    do_sample=False
                )
            
            summary = final_result[0]["summary_text"]
        else:
            result = summarizer(
                request.text,
                max_length=request.max_length,
                min_length=request.min_length,
                do_sample=False
            )
            summary = result[0]["summary_text"]
        
        logger.info(f"✅ Summary: {len(summary)} chars")
        
        return SummarizeResponse(summary=summary)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Summarization error: {e}")
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
    """
    temp_audio_path = None
    
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
        
        logger.info(f"Processing diarization with {min_speakers}-{max_speakers} speakers...")
        
        # Run diarization
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
                "start": float(turn.start),
                "end": float(turn.end),
                "duration": float(turn.end - turn.start)
            })
        
        logger.info(f"✅ Diarization complete: {len(speakers)} speakers, {len(speaker_segments)} segments")
        
        return DiarizeResponse(
            speaker_segments=speaker_segments,
            speakers=sorted(list(speakers)),
            num_speakers=len(speakers)
        )
        
    except Exception as e:
        logger.error(f"❌ Diarization error: {e}")
        raise HTTPException(status_code=500, detail=f"Diarization failed: {str(e)}")
    finally:
        # Clean up temp file
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except:
                pass


@app.post("/calculate-talk-time", response_model=TalkTimeResponse)
async def calculate_talk_time(
    audio: UploadFile = File(...),
    speaker_segments: str = Form(...)  # JSON string of speaker segments
):
    """
    Calculate talk-time metrics from diarization results
    Returns agent/customer talk time, ratio, and dead air detection
    """
    import json
    
    try:
        logger.info(f"📊 Talk-time calculation request: {audio.filename}")
        
        # Parse speaker segments
        segments = json.loads(speaker_segments)
        
        # Get audio duration
        temp_audio_path = f"/tmp/{uuid.uuid4()}_{audio.filename}"
        with open(temp_audio_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)
        
        from pydub import AudioSegment
        audio_file = AudioSegment.from_file(temp_audio_path)
        total_duration = len(audio_file) / 1000.0  # Convert to seconds
        
        # Calculate talk time per speaker
        speaker_talk_time = {}
        for segment in segments:
            speaker = segment["speaker"]
            duration = segment["duration"]
            speaker_talk_time[speaker] = speaker_talk_time.get(speaker, 0) + duration
        
        # Calculate dead air (gaps between segments)
        sorted_segments = sorted(segments, key=lambda x: x["start"])
        dead_air_segments = []
        dead_air_total = 0
        
        for i in range(len(sorted_segments) - 1):
            current_end = sorted_segments[i]["end"]
            next_start = sorted_segments[i + 1]["start"]
            gap = next_start - current_end
            
            if gap > 2.0:  # Dead air threshold: 2 seconds
                dead_air_segments.append({
                    "start": current_end,
                    "end": next_start,
                    "duration": gap
                })
                dead_air_total += gap
        
        # Calculate agent/customer ratio (assume SPEAKER_00 is agent, SPEAKER_01 is customer)
        speakers_list = sorted(speaker_talk_time.keys())
        if len(speakers_list) >= 2:
            agent_time = speaker_talk_time.get(speakers_list[0], 0)
            customer_time = speaker_talk_time.get(speakers_list[1], 0)
            
            if customer_time > 0:
                ratio = agent_time / customer_time
                ratio_str = f"{ratio:.2f}:1"
            else:
                ratio_str = "N/A"
        else:
            ratio_str = "N/A"
        
        logger.info(f"✅ Talk-time calculated: {len(speakers_list)} speakers, {dead_air_total:.1f}s dead air")
        
        # Clean up temp file
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
        
        return TalkTimeResponse(
            speaker_talk_time=speaker_talk_time,
            agent_customer_ratio=ratio_str,
            dead_air_total=dead_air_total,
            dead_air_segments=dead_air_segments,
            total_duration=total_duration
        )
        
    except Exception as e:
        logger.error(f"❌ Talk-time calculation error: {e}")
        raise HTTPException(status_code=500, detail=f"Talk-time calculation failed: {str(e)}")


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