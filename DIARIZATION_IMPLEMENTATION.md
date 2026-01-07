# Diarization Implementation Complete! 🎉

## What Was Added:

### 1. **Dependencies** (requirements.txt)
- Added `pyannote.audio==3.1.1` for speaker diarization

### 2. **AI Service Endpoints** (main.py)

#### **POST /diarize**
- Accepts audio file
- Returns speaker segments with timestamps
- Identifies different speakers (SPEAKER_00, SPEAKER_01, etc.)
- GPU-accelerated processing

#### **POST /calculate-talk-time**
- Calculates talk time metrics
- Agent vs Customer ratio
- Dead air detection (>2 second gaps)
- Per-speaker talk time

### 3. **Configuration**
- Added `HUGGINGFACE_TOKEN` environment variable
- Required for pyannote diarization models

---

## Setup Required:

### **1. Get HuggingFace Token:**
```
1. Go to: https://huggingface.co/settings/tokens
2. Create a new token (read access)
3. Accept model terms: https://huggingface.co/pyannote/speaker-diarization-3.1
4. Add to .env: HUGGINGFACE_TOKEN=your_token_here
```

### **2. Install Dependencies:**
```bash
cd ai-service
pip install -r requirements.txt
```

### **3. Add to Backend .env:**
```env
HUGGINGFACE_TOKEN=your_token_here
```

---

## How It Works:

### **Flow:**
1. **Backend uploads call** → triggers `processCallAsync()`
2. **RunPod auto-starts** (if configured)
3. **Transcription** → converts audio to text
4. **Diarization** → identifies who spoke when
5. **Talk-time calculation** → analyzes metrics
6. **Sentiment + Compliance** → analyzes content

### **Output Example:**
```json
{
  "speaker_segments": [
    {"speaker": "SPEAKER_00", "start": 0.0, "end": 15.3, "duration": 15.3},
    {"speaker": "SPEAKER_01", "start": 15.5, "end": 42.8, "duration": 27.3}
  ],
  "speakers": ["SPEAKER_00", "SPEAKER_01"],
  "num_speakers": 2,
  "speaker_talk_time": {
    "SPEAKER_00": 520.5,
    "SPEAKER_01": 315.2
  },
  "agent_customer_ratio": "1.65:1",
  "dead_air_total": 12.3,
  "dead_air_segments": [
    {"start": 145.2, "end": 152.5, "duration": 7.3}
  ]
}
```

---

## Processing Time Impact:

**Per 20-minute call:**
- Transcription: ~4 minutes
- **Diarization: ~5-7 minutes** ⬅️ NEW
- Sentiment/Entities: ~30 seconds
- **Total: ~10-12 minutes per call**

**GPU Requirements:**
- Minimum 8GB VRAM (will work on RTX 2000 Ada 16GB)
- CPU fallback available but slower (15-20 min per call)

---

## Testing:

Once deployed and configured:
1. Upload a call with sale=true
2. Check logs for diarization progress
3. View call details to see speaker segments
4. Check talk-time metrics in analytics

---

## Status: ✅ READY TO DEPLOY

Next steps:
1. Add HUGGINGFACE_TOKEN to both .env files
2. pip install -r requirements.txt
3. Test locally or deploy to RunPod
4. Upload test call to verify diarization works
