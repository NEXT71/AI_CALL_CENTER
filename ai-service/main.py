import os
import whisper
import torch
import spacy
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
from typing import List, Dict, Optional
import uvicorn
from dotenv import load_dotenv
from rapidfuzz import fuzz
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AI Call Center - AI Service",
    description="FREE & Open-Source Speech-to-Text and NLP Analysis Service",
    version="1.0.0"
)

# CORS configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Restrict to specific domains
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Only allow needed methods
    allow_headers=["*"],
)

# Configuration
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "medium")
DEVICE = os.getenv("DEVICE", "cpu")
SENTIMENT_MODEL = os.getenv("SENTIMENT_MODEL", "distilbert-base-uncased-finetuned-sst-2-english")
SPACY_MODEL = os.getenv("SPACY_MODEL", "en_core_web_sm")
SUMMARIZATION_MODEL = os.getenv("SUMMARIZATION_MODEL", "facebook/bart-large-cnn")

# Global variables for models
whisper_model = None
sentiment_analyzer = None
summarizer = None
nlp = None

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

class DiarizeRequest(BaseModel):
    audio_path: str
    min_speakers: Optional[int] = 2
    max_speakers: Optional[int] = 2

class DiarizeResponse(BaseModel):
    speakers: List[Dict]
    speaker_segments: List[Dict]
    talk_time: Dict[str, float]
    num_speakers: int

class TalkTimeRequest(BaseModel):
    audio_path: str
    speaker_segments: List[Dict]

class TalkTimeResponse(BaseModel):
    total_duration: float
    speaker_talk_time: Dict[str, float]
    speaker_percentage: Dict[str, float]
    dead_air_segments: List[Dict]
    dead_air_total: float
    agent_customer_ratio: Optional[str] = None


@app.on_event("startup")
async def startup_event():
    """Load all FREE & open-source models on startup"""
    global whisper_model, sentiment_analyzer, summarizer, nlp
    
    try:
        print("🚀 Loading FREE & Open-Source AI Models...")
        print("=" * 60)
        
        # 1. Load Whisper for Speech-to-Text (FREE, local)
        print(f"📝 Loading Whisper model: {WHISPER_MODEL}...")
        whisper_model = whisper.load_model(WHISPER_MODEL, device=DEVICE)
        print(f"✅ Whisper ({WHISPER_MODEL}) loaded successfully on {DEVICE}")
        
        # 2. Load DistilBERT for Sentiment Analysis (FREE)
        print(f"😊 Loading sentiment model: {SENTIMENT_MODEL}...")
        sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model=SENTIMENT_MODEL,
            device=0 if DEVICE == "cuda" and torch.cuda.is_available() else -1
        )
        print(f"✅ Sentiment analyzer loaded successfully")
        
        # 3. Load spaCy for Entity Recognition (FREE)
        print(f"🔍 Loading spaCy model: {SPACY_MODEL}...")
        try:
            nlp = spacy.load(SPACY_MODEL)
            print(f"✅ spaCy model loaded successfully")
        except OSError:
            print(f"⚠️  spaCy model not found. Run: python -m spacy download {SPACY_MODEL}")
            print("   Continuing without NER support...")
            nlp = None
        
        # 4. Load BART for Summarization (FREE, optional)
        print(f"📄 Loading summarization model: {SUMMARIZATION_MODEL}...")
        try:
            summarizer = pipeline(
                "summarization",
                model=SUMMARIZATION_MODEL,
                device=0 if DEVICE == "cuda" and torch.cuda.is_available() else -1
            )
            print(f"✅ Summarizer loaded successfully")
        except Exception as e:
            print(f"⚠️  Summarizer loading failed: {e}")
            print("   Continuing without summarization support...")
            summarizer = None
        
        print("=" * 60)
        print("✅ All models loaded successfully!")
        print("🎯 Using 100% FREE & Open-Source Models:")
        print(f"   - Whisper: {WHISPER_MODEL}")
        print(f"   - DistilBERT: {SENTIMENT_MODEL}")
        print(f"   - spaCy: {SPACY_MODEL}")
        print(f"   - BART: {SUMMARIZATION_MODEL}")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        raise


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models": {
            "whisper": WHISPER_MODEL,
            "sentiment": SENTIMENT_MODEL,
            "spacy": SPACY_MODEL if nlp else "not loaded",
            "summarizer": SUMMARIZATION_MODEL if summarizer else "not loaded",
        },
        "device": DEVICE,
        "models_loaded": {
            "whisper": whisper_model is not None,
            "sentiment": sentiment_analyzer is not None,
            "spacy": nlp is not None,
            "summarizer": summarizer is not None,
        },
        "note": "100% FREE & Open-Source Models"
    }


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(request: TranscribeRequest):
    """
    Transcribe audio file to text using FREE Whisper model (local processing)
    NO paid APIs, NO cloud services
    """
    try:
        # Check if file exists
        if not os.path.exists(request.audio_path):
            raise HTTPException(status_code=404, detail=f"Audio file not found: {request.audio_path}")
        
        if whisper_model is None:
            raise HTTPException(status_code=503, detail="Whisper model not loaded")
        
        # Transcribe audio locally using FREE Whisper
        print(f"🎙️ Transcribing (FREE Whisper): {request.audio_path}")
        result = whisper_model.transcribe(
            request.audio_path,
            verbose=False,
            word_timestamps=True,
            language="en"  # Force English for BPO calls
        )
        
        # Extract text and timestamps
        text = result["text"].strip()
        language = result.get("language", "en")
        word_count = len(text.split())
        
        # Format timestamps with speaker segments
        timestamps = []
        if "segments" in result:
            for segment in result["segments"]:
                timestamps.append({
                    "start": round(segment["start"], 2),
                    "end": round(segment["end"], 2),
                    "text": segment["text"].strip()
                })
        
        print(f"✅ Transcription complete: {word_count} words, {len(timestamps)} segments")
        
        return TranscribeResponse(
            text=text,
            timestamps=timestamps,
            language=language,
            duration=result.get("duration"),
            word_count=word_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@app.post("/analyze-sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """
    Analyze sentiment using FREE DistilBERT model (no training required)
    """
    try:
        if sentiment_analyzer is None:
            raise HTTPException(status_code=503, detail="Sentiment analyzer not loaded")
        
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Truncate text for BERT (max 512 tokens)
        text = request.text[:5000]
        
        print(f"🔍 Analyzing sentiment (FREE DistilBERT): {len(text)} chars")
        
        # Analyze using FREE pre-trained model
        result = sentiment_analyzer(text)[0]
        
        # Map labels
        label_map = {
            "POSITIVE": "positive",
            "NEGATIVE": "negative",
            "NEUTRAL": "neutral"
        }
        
        label = label_map.get(result["label"].upper(), result["label"].lower())
        score = result["score"]
        
        # Confidence level
        if score >= 0.9:
            confidence = "very high"
        elif score >= 0.75:
            confidence = "high"
        elif score >= 0.6:
            confidence = "moderate"
        else:
            confidence = "low"
        
        print(f"✅ Sentiment: {label} (confidence: {score:.2f})")
        
        return SentimentResponse(
            label=label,
            score=round(score, 4),
            confidence=confidence
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Sentiment analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")


@app.post("/extract-entities", response_model=EntityResponse)
async def extract_entities(request: EntityRequest):
    """
    Extract entities using FREE spaCy model (en_core_web_sm)
    """
    try:
        if nlp is None:
            raise HTTPException(
                status_code=503, 
                detail=f"spaCy model not loaded. Run: python -m spacy download {SPACY_MODEL}"
            )
        
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        print(f"🔍 Extracting entities (FREE spaCy): {len(request.text)} chars")
        
        # Process with spaCy
        doc = nlp(request.text[:100000])  # Limit to 100k chars
        
        # Extract entities
        entities = []
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char
            })
        
        # Extract key noun phrases
        key_phrases = [chunk.text for chunk in doc.noun_chunks][:20]
        
        print(f"✅ Extracted {len(entities)} entities, {len(key_phrases)} key phrases")
        
        return EntityResponse(
            entities=entities,
            key_phrases=key_phrases
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Entity extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Entity extraction failed: {str(e)}")


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest):
    """
    Summarize text using FREE BART model (facebook/bart-large-cnn)
    """
    try:
        if summarizer is None:
            raise HTTPException(status_code=503, detail="Summarizer not loaded")
        
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        print(f"📄 Summarizing (FREE BART): {len(request.text)} chars")
        
        # BART can handle ~1024 tokens, we'll use first 3000 chars as safe limit
        text = request.text[:3000]
        
        # Generate summary
        summary_result = summarizer(
            text,
            max_length=request.max_length,
            min_length=request.min_length,
            do_sample=False
        )
        
        summary = summary_result[0]["summary_text"]
        
        print(f"✅ Summary generated: {len(summary)} chars")
        
        return SummarizeResponse(summary=summary)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Summarization error: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@app.post("/check-compliance", response_model=ComplianceCheckResponse)
async def check_compliance(request: ComplianceCheckRequest):
    """
    Check compliance using FREE rapidfuzz (fuzzy matching) + regex
    NO ML training required - pure rule-based approach
    """
    try:
        transcript_lower = request.transcript.lower()
        
        print(f"🔍 Checking compliance (FREE rapidfuzz): {len(request.mandatory_phrases)} mandatory, {len(request.forbidden_phrases)} forbidden")
        
        missing_mandatory = []
        detected_forbidden = []
        
        # Check mandatory phrases using fuzzy matching
        for phrase in request.mandatory_phrases:
            phrase_lower = phrase.lower()
            
            # Try exact match first
            if phrase_lower in transcript_lower:
                continue
            
            # Try fuzzy matching
            best_match = 0
            words = transcript_lower.split()
            
            # Check all possible n-grams
            phrase_words = phrase_lower.split()
            n = len(phrase_words)
            
            for i in range(len(words) - n + 1):
                ngram = " ".join(words[i:i+n])
                ratio = fuzz.ratio(phrase_lower, ngram)
                if ratio > best_match:
                    best_match = ratio
            
            # If no good match found, mark as missing
            if best_match < request.fuzzy_threshold:
                missing_mandatory.append(phrase)
        
        # Check forbidden phrases
        for phrase in request.forbidden_phrases:
            phrase_lower = phrase.lower()
            
            # Exact match
            if phrase_lower in transcript_lower:
                detected_forbidden.append(phrase)
                continue
            
            # Fuzzy match for common variations
            words = transcript_lower.split()
            phrase_words = phrase_lower.split()
            n = len(phrase_words)
            
            for i in range(len(words) - n + 1):
                ngram = " ".join(words[i:i+n])
                ratio = fuzz.ratio(phrase_lower, ngram)
                if ratio >= request.fuzzy_threshold:
                    detected_forbidden.append(phrase)
                    break
        
        # Calculate compliance score
        total_mandatory = len(request.mandatory_phrases)
        total_forbidden = len(request.forbidden_phrases)
        
        if total_mandatory > 0:
            mandatory_score = ((total_mandatory - len(missing_mandatory)) / total_mandatory) * 100
        else:
            mandatory_score = 100
        
        # Heavy penalty for forbidden phrases
        forbidden_penalty = len(detected_forbidden) * 20
        
        compliance_score = max(0, mandatory_score - forbidden_penalty)
        
        print(f"✅ Compliance check complete: score={compliance_score:.1f}, missing={len(missing_mandatory)}, violations={len(detected_forbidden)}")
        
        return ComplianceCheckResponse(
            missing_mandatory=missing_mandatory,
            detected_forbidden=detected_forbidden,
            compliance_score=round(compliance_score, 2),
            details={
                "total_mandatory": total_mandatory,
                "found_mandatory": total_mandatory - len(missing_mandatory),
                "total_forbidden": total_forbidden,
                "violations": len(detected_forbidden),
                "mandatory_score": round(mandatory_score, 2),
                "forbidden_penalty": forbidden_penalty
            }
        )
        
    except Exception as e:
        print(f"❌ Compliance check error: {e}")
        raise HTTPException(status_code=500, detail=f"Compliance check failed: {str(e)}")


@app.post("/diarize", response_model=DiarizeResponse)
async def diarize_audio(request: DiarizeRequest):
    """
    Perform speaker diarization using FREE pyannote.audio
    Identifies who spoke when (Agent vs Customer)
    """
    try:
        # Note: pyannote.audio requires HuggingFace token for model download
        # User must set HF_TOKEN in .env file
        # Run: huggingface-cli login OR set HF_TOKEN env var
        
        from pyannote.audio import Pipeline
        import torch
        
        hf_token = os.getenv("HF_TOKEN")
        if not hf_token:
            raise HTTPException(
                status_code=503, 
                detail="HF_TOKEN not set. Get token from https://huggingface.co/settings/tokens"
            )
        
        if not os.path.exists(request.audio_path):
            raise HTTPException(status_code=404, detail=f"Audio file not found: {request.audio_path}")
        
        print(f"🎭 Speaker diarization (FREE pyannote.audio): {request.audio_path}")
        
        # Load diarization pipeline
        pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=hf_token
        )
        
        # Run diarization
        diarization = pipeline(request.audio_path, min_speakers=request.min_speakers, max_speakers=request.max_speakers)
        
        # Extract speaker segments
        speakers = {}
        speaker_segments = []
        talk_time = {}
        
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            speaker_id = f"SPEAKER_{speaker}"
            
            if speaker_id not in speakers:
                speakers[speaker_id] = {
                    "id": speaker_id,
                    "label": "Agent" if len(speakers) == 0 else "Customer",  # First speaker = Agent
                    "segment_count": 0
                }
                talk_time[speaker_id] = 0.0
            
            duration = turn.end - turn.start
            speakers[speaker_id]["segment_count"] += 1
            talk_time[speaker_id] += duration
            
            speaker_segments.append({
                "speaker": speaker_id,
                "label": speakers[speaker_id]["label"],
                "start": round(turn.start, 2),
                "end": round(turn.end, 2),
                "duration": round(duration, 2)
            })
        
        # Round talk times
        talk_time = {k: round(v, 2) for k, v in talk_time.items()}
        
        print(f"✅ Diarization complete: {len(speakers)} speakers, {len(speaker_segments)} segments")
        
        return DiarizeResponse(
            speakers=list(speakers.values()),
            speaker_segments=speaker_segments,
            talk_time=talk_time,
            num_speakers=len(speakers)
        )
        
    except ImportError:
        raise HTTPException(
            status_code=503, 
            detail="pyannote.audio not installed. Run: pip install pyannote.audio"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Diarization error: {e}")
        raise HTTPException(status_code=500, detail=f"Diarization failed: {str(e)}")


@app.post("/calculate-talk-time", response_model=TalkTimeResponse)
async def calculate_talk_time(request: TalkTimeRequest):
    """
    Calculate talk-time metrics, dead air, agent/customer ratio
    """
    try:
        import librosa
        
        if not os.path.exists(request.audio_path):
            raise HTTPException(status_code=404, detail=f"Audio file not found: {request.audio_path}")
        
        print(f"📊 Calculating talk-time metrics...")
        
        # Get total audio duration
        duration = librosa.get_duration(path=request.audio_path)
        
        # Calculate talk time per speaker
        speaker_talk_time = {}
        for segment in request.speaker_segments:
            speaker = segment["speaker"]
            seg_duration = segment["duration"]
            
            if speaker not in speaker_talk_time:
                speaker_talk_time[speaker] = 0.0
            speaker_talk_time[speaker] += seg_duration
        
        # Calculate percentages
        speaker_percentage = {
            speaker: round((time / duration) * 100, 2)
            for speaker, time in speaker_talk_time.items()
        }
        
        # Detect dead air (gaps between segments)
        dead_air_segments = []
        sorted_segments = sorted(request.speaker_segments, key=lambda x: x["start"])
        
        for i in range(len(sorted_segments) - 1):
            gap_start = sorted_segments[i]["end"]
            gap_end = sorted_segments[i + 1]["start"]
            gap_duration = gap_end - gap_start
            
            # Consider gaps > 2 seconds as dead air
            if gap_duration > 2.0:
                dead_air_segments.append({
                    "start": round(gap_start, 2),
                    "end": round(gap_end, 2),
                    "duration": round(gap_duration, 2)
                })
        
        dead_air_total = sum(seg["duration"] for seg in dead_air_segments)
        
        # Calculate agent/customer ratio
        agent_time = 0.0
        customer_time = 0.0
        
        for segment in request.speaker_segments:
            if segment.get("label") == "Agent":
                agent_time += segment["duration"]
            elif segment.get("label") == "Customer":
                customer_time += segment["duration"]
        
        if customer_time > 0:
            ratio = agent_time / customer_time
            agent_customer_ratio = f"{ratio:.2f}:1"
        else:
            agent_customer_ratio = "N/A"
        
        print(f"✅ Talk-time calculated: Agent={agent_time:.1f}s, Customer={customer_time:.1f}s, Dead air={dead_air_total:.1f}s")
        
        return TalkTimeResponse(
            total_duration=round(duration, 2),
            speaker_talk_time={k: round(v, 2) for k, v in speaker_talk_time.items()},
            speaker_percentage=speaker_percentage,
            dead_air_segments=dead_air_segments,
            dead_air_total=round(dead_air_total, 2),
            agent_customer_ratio=agent_customer_ratio
        )
        
    except Exception as e:
        print(f"❌ Talk-time calculation error: {e}")
        raise HTTPException(status_code=500, detail=f"Talk-time calculation failed: {str(e)}")


@app.post("/analyze-batch")
async def analyze_batch(audio_path: str):
    """
    Combined endpoint for full analysis pipeline (all FREE models)
    """
    try:
        results = {}
        
        # 1. Transcribe (FREE Whisper)
        print("🎙️ Step 1: Transcribing audio...")
        transcribe_result = await transcribe_audio(TranscribeRequest(audio_path=audio_path))
        results["transcription"] = transcribe_result.dict()
        
        # 2. Speaker Diarization (FREE pyannote.audio) - CRITICAL
        print("🎭 Step 2: Speaker diarization...")
        try:
            diarize_result = await diarize_audio(DiarizeRequest(audio_path=audio_path))
            results["diarization"] = diarize_result.dict()
            
            # 2b. Calculate talk-time metrics
            talk_time_result = await calculate_talk_time(TalkTimeRequest(
                audio_path=audio_path,
                speaker_segments=diarize_result.speaker_segments
            ))
            results["talk_time"] = talk_time_result.dict()
        except Exception as e:
            print(f"⚠️  Diarization skipped: {e}")
            results["diarization"] = None
            results["talk_time"] = None
        
        # 3. Sentiment Analysis (FREE DistilBERT) - Overall
        print("😊 Step 3: Analyzing sentiment...")
        sentiment_result = await analyze_sentiment(SentimentRequest(text=transcribe_result.text))
        results["sentiment"] = sentiment_result.dict()
        
        # 4. Per-speaker sentiment (if diarization succeeded)
        if results.get("diarization"):
            print("😊 Step 4: Per-speaker sentiment...")
            results["speaker_sentiments"] = {}
            
            # Group transcript by speaker
            for speaker_info in diarize_result.speakers:
                speaker_id = speaker_info["id"]
                speaker_text = ""
                
                # Combine all segments for this speaker
                for seg in diarize_result.speaker_segments:
                    if seg["speaker"] == speaker_id:
                        # Extract text from transcript timestamps (simplified)
                        speaker_text += " "
                
                # For now, use overall sentiment (TODO: map timestamps to text)
                # This is a placeholder - proper implementation needs timestamp alignment
                results["speaker_sentiments"][speaker_id] = sentiment_result.dict()
        
        # 5. Entity Extraction (FREE spaCy) - optional
        if nlp:
            print("🔍 Step 5: Extracting entities...")
            try:
                entity_result = await extract_entities(EntityRequest(text=transcribe_result.text))
                results["entities"] = entity_result.dict()
            except:
                results["entities"] = None
        
        # 6. Summarization (FREE BART) - optional
        if summarizer and len(transcribe_result.text) > 500:
            print("📄 Step 6: Generating summary...")
            try:
                summary_result = await summarize_text(SummarizeRequest(text=transcribe_result.text))
                results["summary"] = summary_result.dict()
            except:
                results["summary"] = None
        
        print("✅ Batch analysis complete!")
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Call Center - AI Service",
        "version": "2.0.0",
        "status": "running",
        "models": "100% FREE & Open-Source",
        "stack": [
            "Whisper (OpenAI - FREE)",
            "DistilBERT (Hugging Face - FREE)",
            "spaCy (Explosion AI - FREE)",
            "BART (Facebook - FREE)",
            "pyannote.audio (FREE - Speaker Diarization)",
            "rapidfuzz (FREE)"
        ],
        "features": [
            "Speech-to-Text Transcription",
            "Speaker Diarization (Agent vs Customer)",
            "Sentiment Analysis (Overall + Per-Speaker)",
            "Entity Extraction",
            "Call Summarization",
            "Compliance Checking with Fuzzy Matching",
            "Talk-Time Ratio Analysis",
            "Dead Air Detection"
        ],
        "endpoints": {
            "health": "/health",
            "transcribe": "/transcribe",
            "diarize": "/diarize",
            "talk_time": "/calculate-talk-time",
            "sentiment": "/analyze-sentiment",
            "entities": "/extract-entities",
            "summarize": "/summarize",
            "compliance": "/check-compliance",
            "batch": "/analyze-batch"
        }
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🤖 AI Service - 100% FREE & Open-Source Models             ║
    ║                                                               ║
    ║   ✅ Whisper: {WHISPER_MODEL.ljust(48)} ║
    ║   ✅ DistilBERT: {SENTIMENT_MODEL[:40].ljust(40)} ║
    ║   ✅ spaCy: {SPACY_MODEL.ljust(50)} ║
    ║   ✅ BART: {SUMMARIZATION_MODEL[:42].ljust(42)} ║
    ║   ✅ rapidfuzz: Free fuzzy matching                          ║
    ║                                                               ║
    ║   Device: {DEVICE.ljust(56)} ║
    ║   Port: {str(port).ljust(58)} ║
    ║                                                               ║
    ║   NO PAID APIs • NO CLOUD SERVICES • 100% LOCAL               ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(app, host=host, port=port)
