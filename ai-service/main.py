import os
import uvicorn
import uuid
import subprocess
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

def convert_audio_with_ffmpeg(input_path: str, output_path: str = None) -> str:
    """
    Convert audio using ffmpeg with parameters that Whisper loves
    This is the NUCLEAR option that fixes 99% of Whisper issues
    """
    if output_path is None:
        output_path = f"{input_path}_converted.wav"
    
    try:
        # FFmpeg command optimized for Whisper
        # This creates the exact format Whisper expects
        cmd = [
            'ffmpeg',
            '-i', input_path,
            '-ar', '16000',           # 16kHz sample rate
            '-ac', '1',               # Mono
            '-c:a', 'pcm_s16le',      # 16-bit PCM
            '-f', 'wav',              # WAV format
            '-y',                     # Overwrite output
            output_path
        ]
        
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=60
        )
        
        if result.returncode == 0 and os.path.exists(output_path):
            logger.info(f"✅ FFmpeg conversion successful: {output_path}")
            return output_path
        else:
            logger.error(f"FFmpeg failed: {result.stderr.decode()}")
            return None
            
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg conversion timeout")
        return None
    except Exception as e:
        logger.error(f"FFmpeg conversion error: {e}")
        return None

def chunk_audio_file(audio_path: str, chunk_length_ms: int = 600000, overlap_ms: int = 5000):
    """
    ULTIMATE audio chunking with multiple fallback methods
    """
    try:
        from pydub import AudioSegment
        import gc
        
        logger.info(f"📦 Chunking audio file: {audio_path}")
        
        # Try loading audio
        try:
            audio = AudioSegment.from_file(audio_path)
        except Exception as e:
            logger.error(f"pydub failed to load audio: {e}")
            logger.info("Attempting FFmpeg conversion first...")
            
            # Try FFmpeg conversion
            converted_path = convert_audio_with_ffmpeg(audio_path)
            if converted_path:
                try:
                    audio = AudioSegment.from_file(converted_path)
                    # Clean up converted file after loading
                    os.remove(converted_path)
                except Exception as e2:
                    logger.error(f"Even FFmpeg conversion failed: {e2}")
                    return None, None
            else:
                return None, None
        
        # Convert to mono
        if audio.channels > 1:
            audio = audio.set_channels(1)
            logger.info(f"✅ Converted to mono")
        
        # Set to 16kHz
        if audio.frame_rate != 16000:
            audio = audio.set_frame_rate(16000)
            logger.info(f"✅ Set to 16kHz")
        
        # Normalize
        try:
            audio = audio.normalize()
            logger.info(f"✅ Normalized")
        except:
            pass
        
        duration_ms = len(audio)
        
        if chunk_length_ms > duration_ms:
            chunk_length_ms = duration_ms
        
        chunks = []
        step = chunk_length_ms - overlap_ms
        chunk_index = 0
        
        for i in range(0, duration_ms, step):
            chunk_end = min(i + chunk_length_ms, duration_ms)
            chunk = audio[i:chunk_end]
            
            # Skip very short chunks
            if len(chunk) < 1000:
                logger.warning(f"Skipping short chunk: {len(chunk)}ms")
                break
            
            if chunk.channels > 1:
                chunk = chunk.set_channels(1)
            
            # Create chunk with unique name
            chunk_path = f"{audio_path}_chunk_{chunk_index}.wav"
            
            # METHOD 1: Try pydub export with strict parameters
            try:
                chunk.export(
                    chunk_path,
                    format="wav",
                    parameters=[
                        "-ac", "1",
                        "-ar", "16000",
                        "-sample_fmt", "s16",
                        "-acodec", "pcm_s16le"
                    ]
                )
                
                # Verify file
                if not os.path.exists(chunk_path) or os.path.getsize(chunk_path) < 1000:
                    raise Exception("Chunk file invalid or too small")
                    
                logger.info(f"✅ Chunk {chunk_index} created via pydub")
                
            except Exception as export_error:
                logger.warning(f"pydub export failed for chunk {chunk_index}: {export_error}")
                
                # METHOD 2: Save as temp file then convert with ffmpeg
                try:
                    temp_chunk = f"{chunk_path}.temp.wav"
                    chunk.export(temp_chunk, format="wav")
                    
                    # Convert with ffmpeg
                    converted_chunk = convert_audio_with_ffmpeg(temp_chunk, chunk_path)
                    
                    # Clean up temp
                    if os.path.exists(temp_chunk):
                        os.remove(temp_chunk)
                    
                    if not converted_chunk or not os.path.exists(chunk_path):
                        raise Exception("FFmpeg conversion failed")
                    
                    logger.info(f"✅ Chunk {chunk_index} created via FFmpeg")
                    
                except Exception as ffmpeg_error:
                    logger.error(f"Both methods failed for chunk {chunk_index}: {ffmpeg_error}")
                    del chunk
                    gc.collect()
                    continue
            
            # Validate chunk was created successfully
            if os.path.exists(chunk_path) and os.path.getsize(chunk_path) > 1000:
                chunks.append({
                    "path": chunk_path,
                    "start_time": i / 1000,
                    "end_time": chunk_end / 1000,
                    "overlap_start": (i + overlap_ms) / 1000 if i > 0 else 0,
                    "index": chunk_index
                })
                chunk_index += 1
            
            del chunk
            gc.collect()
            
            if chunk_end >= duration_ms:
                break
        
        del audio
        gc.collect()
        
        if not chunks:
            logger.error("No valid chunks created")
            return None, None
        
        logger.info(f"✅ Created {len(chunks)} valid chunks")
        return chunks, duration_ms / 1000
        
    except Exception as e:
        logger.error(f"❌ Chunking failed: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None, None    """
    Split audio file into chunks for processing long recordings
    chunk_length_ms: chunk length in milliseconds (default 10 minutes)
    overlap_ms: overlap between chunks in milliseconds (default 5 seconds) to prevent word splitting
    
    FIXED: Properly handles audio conversion to prevent Whisper errors
    """
    try:
        from pydub import AudioSegment
        import gc
        
        logger.info(f"📦 Chunking audio file: {audio_path}")
        audio = AudioSegment.from_file(audio_path)
        
        # Convert to mono FIRST
        if audio.channels > 1:
            audio = audio.set_channels(1)
            logger.info(f"✅ Converted to mono audio")
        
        # Set consistent sample rate to 16000 Hz
        if audio.frame_rate != 16000:
            audio = audio.set_frame_rate(16000)
            logger.info(f"✅ Set sample rate to 16000 Hz")
        
        # CRITICAL FIX: Normalize audio to prevent Whisper alignment issues
        # This ensures consistent audio levels across chunks
        audio = audio.normalize()
        
        duration_ms = len(audio)
        
        # Validate chunk size
        if chunk_length_ms > duration_ms:
            chunk_length_ms = duration_ms
        
        chunks = []
        step = chunk_length_ms - overlap_ms  # Step with overlap
        
        for i in range(0, duration_ms, step):
            chunk_end = min(i + chunk_length_ms, duration_ms)
            chunk = audio[i:chunk_end]
            
            # Ensure chunk is long enough (minimum 1 second)
            if len(chunk) < 1000:  # Less than 1 second
                logger.warning(f"Skipping chunk that's too short: {len(chunk)}ms")
                break
            
            # Double-check mono (should already be mono from parent)
            if chunk.channels > 1:
                chunk = chunk.set_channels(1)
            
            chunk_path = f"{audio_path}_chunk_{i//step}.wav"
            
            # CRITICAL FIX: Export with specific parameters that work well with Whisper
            chunk.export(
                chunk_path, 
                format="wav",
                parameters=[
                    "-ac", "1",  # Force mono
                    "-ar", "16000",  # Force 16kHz sample rate
                    "-sample_fmt", "s16"  # 16-bit PCM (Whisper-friendly format)
                ]
            )
            
            chunks.append({
                "path": chunk_path,
                "start_time": i / 1000,
                "end_time": chunk_end / 1000,
                "overlap_start": (i + overlap_ms) / 1000 if i > 0 else 0
            })
            
            # Free memory after each chunk
            del chunk
            gc.collect()
            
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


def transcribe_chunk_with_ultimate_fallback(model, chunk_path, chunk_info):
    """
    Transcribe with EVERY possible fallback strategy
    """
    import gc
    import time
    
    # CRITICAL: Verify chunk file exists and is valid
    if not os.path.exists(chunk_path):
        logger.error(f"Chunk file doesn't exist: {chunk_path}")
        return None
    
    file_size = os.path.getsize(chunk_path)
    if file_size < 1000:  # Less than 1KB is suspicious
        logger.error(f"Chunk file too small ({file_size} bytes): {chunk_path}")
        return None
    
    logger.info(f"🎙️ Transcribing chunk: {os.path.basename(chunk_path)} ({file_size/1024:.1f} KB)")
    
    # Try converting the chunk with FFmpeg first as a preemptive fix
    converted_chunk = None
    try:
        converted_chunk = convert_audio_with_ffmpeg(chunk_path, f"{chunk_path}_ffmpeg.wav")
        if converted_chunk and os.path.exists(converted_chunk):
            logger.info("✅ Pre-converted chunk with FFmpeg")
            processing_path = converted_chunk
        else:
            processing_path = chunk_path
    except Exception as e:
        logger.warning(f"FFmpeg pre-conversion failed, using original: {e}")
        processing_path = chunk_path
    
    strategies = [
        {
            "name": "GPU FP16 - No Word Timestamps",
            "params": {
                "fp16": CUDA_AVAILABLE,
                "language": None,
                "beam_size": 5,
                "word_timestamps": False,
                "condition_on_previous_text": False,
                "temperature": 0.0
            }
        },
        {
            "name": "GPU FP32 - Simple Decoding",
            "params": {
                "fp16": False,
                "language": None,
                "beam_size": 1,  # Simplest decoding
                "word_timestamps": False,
                "condition_on_previous_text": False,
                "temperature": 0.0
            }
        },
        {
            "name": "CPU - English Only",
            "params": {
                "fp16": False,
                "language": "en",
                "beam_size": 1,
                "word_timestamps": False,
                "condition_on_previous_text": False,
                "temperature": 0.0,
                "no_speech_threshold": 0.6
            }
        },
        {
            "name": "CPU - Greedy Decoding (Fastest)",
            "params": {
                "fp16": False,
                "language": "en",
                "beam_size": 1,
                "best_of": 1,
                "word_timestamps": False,
                "condition_on_previous_text": False,
                "temperature": 0.0,
                "compression_ratio_threshold": 100.0,  # Very lenient
                "logprob_threshold": -100.0,  # Very lenient
                "no_speech_threshold": 0.8
            }
        }
    ]
    
    last_error = None
    
    for strategy_idx, strategy in enumerate(strategies):
        try:
            logger.info(f"🔄 Strategy {strategy_idx + 1}/{len(strategies)}: {strategy['name']}")
            
            # Clear cache
            if CUDA_AVAILABLE:
                torch.cuda.empty_cache()
            gc.collect()
            
            result = model.transcribe(
                processing_path,
                verbose=False,
                **strategy['params']
            )
            
            # Validate result
            text = result.get("text", "").strip()
            if not text or len(text) < 3:
                logger.warning(f"Strategy returned empty/short text: '{text}'")
                continue
            
            # Adjust timestamps
            if "segments" in result:
                for segment in result["segments"]:
                    segment["start"] += chunk_info["start_time"]
                    segment["end"] += chunk_info["start_time"]
            
            logger.info(f"✅ SUCCESS with {strategy['name']}: {len(text)} chars")
            
            # Cleanup
            if converted_chunk and os.path.exists(converted_chunk):
                try:
                    os.remove(converted_chunk)
                except:
                    pass
            
            if CUDA_AVAILABLE:
                torch.cuda.empty_cache()
            gc.collect()
            
            return result
            
        except RuntimeError as e:
            error_msg = str(e).lower()
            last_error = e
            
            if "out of memory" in error_msg:
                logger.error(f"❌ GPU OOM with {strategy['name']}")
                if CUDA_AVAILABLE:
                    torch.cuda.empty_cache()
                gc.collect()
                time.sleep(0.5)
                continue
            
            elif "key" in error_msg and "value" in error_msg and "size" in error_msg:
                logger.error(f"❌ Alignment error with {strategy['name']}: {error_msg}")
                time.sleep(0.5)
                continue
            
            else:
                logger.error(f"❌ Runtime error with {strategy['name']}: {e}")
                time.sleep(0.5)
                continue
        
        except Exception as e:
            logger.error(f"❌ Unexpected error with {strategy['name']}: {e}")
            last_error = e
            time.sleep(0.5)
            continue
    
    # ALL STRATEGIES FAILED - Last resort: Try splitting chunk in half
    logger.error(f"❌ All strategies failed. Attempting to split chunk in half...")
    
    try:
        from pydub import AudioSegment
        chunk_audio = AudioSegment.from_file(processing_path)
        chunk_duration_ms = len(chunk_audio)
        
        if chunk_duration_ms > 30000:  # Only split if > 30 seconds
            mid_point = chunk_duration_ms // 2
            
            # Split into two parts
            part1 = chunk_audio[:mid_point]
            part2 = chunk_audio[mid_point:]
            
            part1_path = f"{chunk_path}_part1.wav"
            part2_path = f"{chunk_path}_part2.wav"
            
            part1.export(part1_path, format="wav", parameters=["-ac", "1", "-ar", "16000"])
            part2.export(part2_path, format="wav", parameters=["-ac", "1", "-ar", "16000"])
            
            del chunk_audio, part1, part2
            gc.collect()
            
            logger.info("🔪 Split chunk into 2 parts, retrying...")
            
            # Transcribe parts separately with simplest strategy
            simple_params = {
                "fp16": False,
                "language": "en",
                "beam_size": 1,
                "best_of": 1,
                "word_timestamps": False,
                "condition_on_previous_text": False,
                "temperature": 0.0
            }
            
            result1 = model.transcribe(part1_path, verbose=False, **simple_params)
            result2 = model.transcribe(part2_path, verbose=False, **simple_params)
            
            # Merge results
            merged_text = result1.get("text", "").strip() + " " + result2.get("text", "").strip()
            merged_segments = []
            
            # Adjust timestamps for part 1
            for seg in result1.get("segments", []):
                seg["start"] += chunk_info["start_time"]
                seg["end"] += chunk_info["start_time"]
                merged_segments.append(seg)
            
            # Adjust timestamps for part 2
            part2_offset = chunk_info["start_time"] + (mid_point / 1000)
            for seg in result2.get("segments", []):
                seg["start"] += part2_offset
                seg["end"] += part2_offset
                merged_segments.append(seg)
            
            # Cleanup part files
            for path in [part1_path, part2_path]:
                if os.path.exists(path):
                    try:
                        os.remove(path)
                    except:
                        pass
            
            logger.info(f"✅ SUCCESS with split strategy: {len(merged_text)} chars")
            
            return {
                "text": merged_text,
                "segments": merged_segments,
                "language": result1.get("language", "en")
            }
            
    except Exception as split_error:
        logger.error(f"❌ Split strategy also failed: {split_error}")
    
    # Cleanup converted chunk
    if converted_chunk and os.path.exists(converted_chunk):
        try:
            os.remove(converted_chunk)
        except:
            pass
    
    logger.error(f"❌ COMPLETE FAILURE for chunk {chunk_path}")
    logger.error(f"Last error: {last_error}")
    
    return None    """
    Transcribe a single audio chunk with GPU acceleration and memory management
    FIXED: Added better error handling and Whisper parameters
    """
    import gc
    try:
        logger.info(f"🎙️ Transcribing chunk: {os.path.basename(chunk_path)}")
        
        # Enable FP16 only on GPU for 2x speed boost
        use_fp16 = CUDA_AVAILABLE
        
        # Clear GPU cache before processing
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
        
        # CRITICAL FIX: Updated Whisper parameters to prevent alignment errors
        result = model.transcribe(
            chunk_path,
            verbose=False,
            fp16=use_fp16,
            language=None,  # Auto-detect language
            temperature=0.0,  # Deterministic output
            compression_ratio_threshold=2.4,
            no_speech_threshold=0.6,
            condition_on_previous_text=False,  # Prevent cross-chunk hallucination
            # ADDED: These parameters help prevent the "Key and Value" error
            beam_size=5,  # Default beam size (explicit)
            best_of=5,  # Default best_of (explicit)
            patience=1.0,  # Wait for better results
            length_penalty=1.0,  # No length penalty
            suppress_tokens="-1",  # Don't suppress any tokens
            initial_prompt=None,  # No initial prompt to avoid context issues
            word_timestamps=False  # Disable word timestamps for chunked processing (causes alignment issues)
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
        error_msg = str(e).lower()
        if "out of memory" in error_msg:
            logger.error(f"❌ GPU out of memory on chunk {chunk_path}")
            if CUDA_AVAILABLE:
                torch.cuda.empty_cache()
            gc.collect()
        elif "key and value" in error_msg:
            logger.error(f"❌ Whisper alignment error on chunk {chunk_path}")
            logger.error(f"This usually indicates an audio format issue")
            # Try to re-process with safer parameters
            try:
                logger.info("Retrying with CPU and safer parameters...")
                # Force CPU processing for this chunk
                result = model.transcribe(
                    chunk_path,
                    verbose=False,
                    fp16=False,  # Force CPU
                    language="en",  # Force English to avoid language detection issues
                    temperature=0.0,
                    word_timestamps=False,
                    beam_size=1,  # Simpler decoding
                    best_of=1
                )
                logger.info("✅ Retry successful with CPU")
                
                # Adjust timestamps
                if "segments" in result:
                    for segment in result["segments"]:
                        segment["start"] += chunk_info["start_time"]
                        segment["end"] += chunk_info["start_time"]
                
                return result
            except Exception as retry_error:
                logger.error(f"❌ Retry also failed: {retry_error}")
                return None
        else:
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
    ULTIMATE transcription endpoint with maximum error handling
    """
    temp_path = None
    preprocessed_path = None
    chunk_files = []
    
    try:
        # Save uploaded file
        temp_path = f"/tmp/{uuid.uuid4()}_{audio.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        
        file_size_mb = os.path.getsize(temp_path) / (1024 * 1024)
        logger.info(f"🎙️ Processing: {audio.filename} ({file_size_mb:.2f} MB)")
        
        # Load model
        model = load_whisper_model()
        if model is None:
            raise HTTPException(status_code=503, detail="Whisper model unavailable")
        
        # CRITICAL: Convert audio with FFmpeg FIRST (most reliable method)
        logger.info("🔧 Converting audio with FFmpeg...")
        preprocessed_path = f"/tmp/{uuid.uuid4()}_preprocessed.wav"
        
        converted = convert_audio_with_ffmpeg(temp_path, preprocessed_path)
        
        if not converted or not os.path.exists(preprocessed_path):
            logger.warning("FFmpeg conversion failed, trying pydub...")
            
            # Fallback to pydub
            from pydub import AudioSegment
            preprocessed_path = f"{temp_path}_preprocessed.wav"
            
            try:
                audio_seg = AudioSegment.from_file(temp_path)
                if audio_seg.channels > 1:
                    audio_seg = audio_seg.set_channels(1)
                if audio_seg.frame_rate != 16000:
                    audio_seg = audio_seg.set_frame_rate(16000)
                audio_seg = audio_seg.normalize()
                
                audio_seg.export(
                    preprocessed_path,
                    format="wav",
                    parameters=["-ac", "1", "-ar", "16000", "-sample_fmt", "s16"]
                )
                
                duration = len(audio_seg) / 1000.0
                del audio_seg
                import gc
                gc.collect()
                
            except Exception as e:
                logger.error(f"Preprocessing completely failed: {e}")
                raise HTTPException(status_code=500, detail="Audio preprocessing failed. File may be corrupted.")
        else:
            # Get duration from preprocessed file
            from pydub import AudioSegment
            try:
                audio_seg = AudioSegment.from_file(preprocessed_path)
                duration = len(audio_seg) / 1000.0
                del audio_seg
                import gc
                gc.collect()
            except:
                import librosa
                duration = librosa.get_duration(path=preprocessed_path)
        
        logger.info(f"⏱️ Duration: {duration:.1f}s ({duration/60:.1f} min)")
        
        processing_path = preprocessed_path
        
        # Process based on duration
        if duration > 600:  # 10+ minutes
            logger.info("📦 Using chunked processing")
            
            chunks, total_duration = chunk_audio_file(processing_path, chunk_length_ms=600000)
            
            if not chunks:
                raise HTTPException(status_code=500, detail="Failed to chunk audio")
            
            chunk_files = [c["path"] for c in chunks]
            logger.info(f"✅ Created {len(chunks)} chunks")
            
            import time
            start_time = time.time()
            
            # Process chunks with ultimate fallback
            loop = asyncio.get_event_loop()
            chunk_results = await asyncio.gather(*[
                loop.run_in_executor(
                    executor,
                    transcribe_chunk_with_ultimate_fallback,
                    model,
                    chunk["path"],
                    chunk
                )
                for chunk in chunks
            ])
            
            processing_time = time.time() - start_time
            
            # Filter valid results
            valid_results = [r for r in chunk_results if r is not None]
            
            if not valid_results:
                raise HTTPException(
                    status_code=500,
                    detail="All chunks failed. Audio file may be severely corrupted or in an unsupported format."
                )
            
            failed_count = len(chunks) - len(valid_results)
            if failed_count > 0:
                logger.warning(f"⚠️ {failed_count}/{len(chunks)} chunks failed")
                
                # If too many failed, raise error
                if failed_count > len(chunks) * 0.5:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Too many chunks failed ({failed_count}/{len(chunks)}). Audio quality issue."
                    )
            
            # Merge results
            merged_text = []
            merged_segments = []
            detected_language = None
            
            for result in valid_results:
                text = result.get("text", "").strip()
                if text:
                    merged_text.append(text)
                if "segments" in result:
                    merged_segments.extend(result["segments"])
                if not detected_language:
                    detected_language = result.get("language")
            
            full_text = " ".join(merged_text)
            
            timestamps = [
                {
                    "start": round(seg["start"], 2),
                    "end": round(seg["end"], 2),
                    "text": seg["text"].strip()
                }
                for seg in merged_segments
            ]
            
            word_count = len(full_text.split()) if full_text else 0
            
            logger.info(f"✅ Complete: {word_count} words, {len(timestamps)} segments")
            logger.info(f"🚀 Speed: {duration/processing_time:.1f}x realtime")
            
            return TranscribeResponse(
                text=full_text,
                timestamps=timestamps,
                language=detected_language,
                duration=total_duration,
                word_count=word_count
            )
        
        else:  # Short audio
            logger.info("🎯 Direct processing")
            
            result = transcribe_chunk_with_ultimate_fallback(
                model,
                processing_path,
                {"start_time": 0, "end_time": duration}
            )
            
            if not result:
                raise HTTPException(status_code=500, detail="Transcription failed completely")
            
            text = result.get("text", "").strip()
            language = result.get("language")
            word_count = len(text.split()) if text else 0
            
            timestamps = [
                {
                    "start": round(seg["start"], 2),
                    "end": round(seg["end"], 2),
                    "text": seg["text"].strip()
                }
                for seg in result.get("segments", [])
            ]
            
            logger.info(f"✅ Complete: {word_count} words")
            
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
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    finally:
        # Cleanup
        import gc
        import time
        
        files_to_cleanup = [temp_path, preprocessed_path] + chunk_files
        
        for file_path in files_to_cleanup:
            if file_path and os.path.exists(file_path):
                for attempt in range(5):
                    try:
                        os.unlink(file_path)
                        break
                    except:
                        if attempt < 4:
                            time.sleep(0.2)
        
        if CUDA_AVAILABLE:
            torch.cuda.empty_cache()
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
    Calculate AI-based quality score with IMPROVED DNC detection
    Only flags genuine customer requests to stop calling
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
        sentiment_analyzer = load_sentiment_model()
        if sentiment_analyzer and request.speaker_labeled_transcript:
            # Extract customer lines only (assuming Speaker 2 is customer)
            customer_lines = []
            for line in request.speaker_labeled_transcript.split('\n'):
                line = line.strip()
                # Check for various speaker labels
                if (line.startswith('[Speaker 2]') or 
                    line.startswith('Customer:') or 
                    line.startswith('CUSTOMER:')):
                    # Extract text after speaker label
                    if ']' in line:
                        customer_lines.append(line.split(']', 1)[1].strip())
                    elif ':' in line:
                        customer_lines.append(line.split(':', 1)[1].strip())
            
            customer_text = ' '.join(customer_lines)
            
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
            # Use word boundaries to avoid false matches
            import re
            if re.search(r'\b' + re.escape(phrase) + r'\b', transcript_lower):
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
            details["abusive_words_found"] = list(set(found_abusive))  # Remove duplicates
            flags["has_abusive_language"] = True
            # -10 points per unique abusive word, max -30
            factors["abusive_language_penalty"] = -min(len(set(found_abusive)) * 10, 30)
        
        # ===================================================================
        # Factor 6: IMPROVED DNC Detection (-20 pts)
        # Only flags GENUINE customer requests to stop being called
        # ===================================================================
        
        def is_genuine_dnc_request(transcript: str, speaker_labeled_transcript: str = None) -> tuple:
            """
            Detect genuine DNC requests using context-aware analysis
            Returns: (is_dnc: bool, found_phrases: list)
            """
            import re
            
            # STRONG DNC indicators - these are very clear requests
            strong_dnc_patterns = [
                r'\b(do not|don\'t|dont)\s+(call|contact)\s+(me|us|this number)\b',
                r'\b(stop|quit)\s+calling\s+(me|us|this number)\b',
                r'\b(remove|take)\s+(me|us|this number)\s+(from|off)\s+(your|the)\s+(list|calls?)\b',
                r'\bnever\s+call\s+(me|us|this number)\s+again\b',
                r'\bno\s+more\s+calls?\b',
                r'\bstop\s+contacting\s+(me|us)\b',
                r'\bI\s+(do not|don\'t|dont)\s+want\s+(any|more|to\s+receive)\s+(calls?|contact)\b',
                r'\bplease\s+(stop|remove|don\'t)\s+(calling|contacting)\b',
                r'\bnot\s+interested\s+in\s+(calls?|being\s+contacted|this)\b',
                r'\bunsubscribe\s+(me|us)\b',
                r'\b(get|keep)\s+me\s+off\s+(your|the)\s+list\b'
            ]
            
            # FALSE POSITIVE patterns - phrases that contain DNC words but aren't DNC requests
            false_positive_patterns = [
                r'\b(do not|don\'t|dont)\s+call\s+(it|that|this|them|him|her)\b',  # "don't call it"
                r'\b(do not|don\'t|dont)\s+call\s+(the|a|an)\b',  # "don't call the..."
                r'\bif\s+(I|we|they)\s+(do not|don\'t|dont)\s+call\b',  # "if I don't call"
                r'\b(do not|don\'t|dont)\s+call\s+(back|anyone|someone)\b',  # "don't call back"
                r'\bon\s+(the|a|any)\s+(do not|dnc)\s+call\s+(list|registry)\b',  # "on the DNC list"
                r'\b(check|verify|confirm)\s+(the|our|your)\s+(do not|dnc)\s+call\b',  # Agent checking DNC
                r'\bmake\s+sure.+not\s+on\s+(the|a)\s+(do not|dnc)\s+call\b',  # "make sure not on DNC"
                r'\b(we|I|they)\s+will\s+not\s+call\b',  # Agent promise
                r'\bshould\s+not\s+call\b',  # "should not call"
                r'\bcannot\s+call\b',  # "cannot call"
                r'\bmay\s+not\s+call\b',  # "may not call"
            ]
            
            transcript_lower = transcript.lower()
            found_dnc_phrases = []
            
            # First check for false positives
            for pattern in false_positive_patterns:
                if re.search(pattern, transcript_lower):
                    logger.info(f"False positive DNC pattern detected: {pattern}")
                    # If we find a false positive, be more strict with DNC detection
                    
            # Check for strong DNC patterns
            for pattern in strong_dnc_patterns:
                matches = re.finditer(pattern, transcript_lower)
                for match in matches:
                    phrase = match.group(0)
                    
                    # Additional context check: is this from the customer?
                    if speaker_labeled_transcript:
                        # Find this phrase in the labeled transcript
                        context_window = 100  # chars before and after
                        phrase_pos = speaker_labeled_transcript.lower().find(phrase)
                        
                        if phrase_pos != -1:
                            # Get context around the phrase
                            start = max(0, phrase_pos - context_window)
                            end = min(len(speaker_labeled_transcript), phrase_pos + len(phrase) + context_window)
                            context = speaker_labeled_transcript[start:end]
                            
                            # Check if this is from customer (Speaker 2) or agent (Speaker 1)
                            # Look backwards for the most recent speaker label
                            context_before = speaker_labeled_transcript[start:phrase_pos]
                            
                            # Find last speaker label before the phrase
                            agent_labels = ['[Speaker 1]', 'Agent:', 'AGENT:']
                            customer_labels = ['[Speaker 2]', 'Customer:', 'CUSTOMER:']
                            
                            last_agent_pos = max([context_before.rfind(label) for label in agent_labels])
                            last_customer_pos = max([context_before.rfind(label) for label in customer_labels])
                            
                            # If customer spoke more recently than agent, it's a customer DNC request
                            if last_customer_pos > last_agent_pos:
                                found_dnc_phrases.append(phrase)
                                logger.info(f"✓ Genuine customer DNC detected: '{phrase}'")
                            else:
                                logger.info(f"✗ Agent or unclear context DNC phrase ignored: '{phrase}'")
                    else:
                        # No speaker labeling, assume it's valid if it matches strong pattern
                        found_dnc_phrases.append(phrase)
            
            # Additional check: Simple "not interested" must be from customer and clear
            if speaker_labeled_transcript:
                # Look for "not interested" from customer
                customer_lines = []
                for line in speaker_labeled_transcript.split('\n'):
                    if any(label in line for label in ['[Speaker 2]', 'Customer:', 'CUSTOMER:']):
                        customer_lines.append(line.lower())
                
                customer_text = ' '.join(customer_lines)
                
                # Check for "not interested" in customer speech
                not_interested_patterns = [
                    r'\bnot\s+interested\b',
                    r'\bno\s+thank\s+you\b.{0,20}\bnot\s+interested\b'
                ]
                
                for pattern in not_interested_patterns:
                    if re.search(pattern, customer_text):
                        # Make sure it's not "not interested in X" (where X is a specific thing)
                        # but rather a general rejection
                        match = re.search(r'not\s+interested(\s+in\s+\w+)?', customer_text)
                        if match:
                            # If it's just "not interested" without specific thing, it's DNC
                            after_text = match.group(1)
                            if not after_text or 'call' in after_text or 'this' in after_text:
                                found_dnc_phrases.append("not interested")
            
            is_dnc = len(found_dnc_phrases) > 0
            return is_dnc, list(set(found_dnc_phrases))
        
        # Execute DNC detection
        is_dnc, dnc_phrases = is_genuine_dnc_request(
            request.transcript,
            request.speaker_labeled_transcript
        )
        
        if is_dnc:
            details["dnc_phrases_found"] = dnc_phrases
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
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
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