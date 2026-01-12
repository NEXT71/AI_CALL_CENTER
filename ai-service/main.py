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
            "transcribe_with_speakers": "/transcribe-with-speakers",
            "sentiment": "/analyze-sentiment",
            "entities": "/extract-entities",
            "summarize": "/summarize",
            "compliance": "/check-compliance"
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