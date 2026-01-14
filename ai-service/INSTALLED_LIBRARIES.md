# AI Service - Installed Libraries

This document lists all Python packages installed in the RunPod AI service environment.

## Installation Date
January 13, 2026

## Environment Specifications
- **Python Version**: 3.11
- **CUDA Version**: 12.1
- **PyTorch Build**: 2.4.1+cu121
- **GPU**: NVIDIA RTX 4000 Ada Generation (19.7GB VRAM)

---

## Core Web Framework

| Package | Version |
|---------|---------|
| fastapi | 0.115.0 |
| uvicorn | 0.32.0 |
| starlette | 0.38.6 |
| python-multipart | 0.0.12 |
| python-dotenv | 1.0.1 |
| pydantic | 2.10.3 |
| pydantic_core | 2.27.1 |

---

## PyTorch & Deep Learning

| Package | Version |
|---------|---------|
| torch | 2.4.1+cu121 |
| torchaudio | 2.4.1+cu121 |
| torchvision | 0.19.1+cu124 |
| pytorch-lightning | 2.6.0 |
| lightning | 2.6.0 |
| lightning-utilities | 0.15.2 |
| torchmetrics | 1.8.2 |
| triton | 3.0.0 |

### NVIDIA CUDA Libraries

| Package | Version |
|---------|---------|
| nvidia-cublas-cu12 | 12.1.3.1 |
| nvidia-cuda-cupti-cu12 | 12.1.105 |
| nvidia-cuda-nvrtc-cu12 | 12.1.105 |
| nvidia-cuda-runtime-cu12 | 12.1.105 |
| nvidia-cudnn-cu12 | 9.1.0.70 |
| nvidia-cufft-cu12 | 11.0.2.54 |
| nvidia-cufile-cu12 | 1.13.1.3 |
| nvidia-curand-cu12 | 10.3.2.106 |
| nvidia-cusolver-cu12 | 11.4.5.107 |
| nvidia-cusparse-cu12 | 12.1.0.106 |
| nvidia-cusparselt-cu12 | 0.7.1 |
| nvidia-nccl-cu12 | 2.20.5 |
| nvidia-nvjitlink-cu12 | 12.9.86 |
| nvidia-nvshmem-cu12 | 3.3.20 |
| nvidia-nvtx-cu12 | 12.1.105 |

---

## AI Models & NLP

### Speech & Audio AI

| Package | Version | Purpose |
|---------|---------|---------|
| openai-whisper | 20250625 | Speech-to-text transcription |
| pyannote.audio | 3.1.1 | Speaker diarization |
| pyannote-core | 6.0.1 | Pyannote core utilities |
| pyannote-database | 6.1.1 | Pyannote database interface |
| pyannote-metrics | 4.0.0 | Diarization metrics |
| pyannote-pipeline | 4.0.0 | Pyannote pipeline framework |
| speechbrain | 1.0.3 | Speech processing toolkit |
| asteroid-filterbanks | 0.4.0 | Audio filterbanks |

### Transformers & Language Models

| Package | Version | Purpose |
|---------|---------|---------|
| transformers | 4.47.1 | HuggingFace transformers (sentiment, summarization) |
| tokenizers | 0.21.4 | Fast tokenization |
| sentencepiece | 0.2.1 | Subword tokenization |
| tiktoken | 0.12.0 | OpenAI tokenizer |

### spaCy NLP

| Package | Version | Purpose |
|---------|---------|---------|
| spacy | 3.8.3 | NLP framework (NER, POS tagging) |
| en_core_web_sm | 3.8.0 | English language model |
| spacy-legacy | 3.0.12 | Legacy spaCy components |
| spacy-loggers | 1.0.5 | Logging utilities |
| thinc | 8.3.10 | Neural network library for spaCy |

---

## Data Science & Scientific Computing

### Core Libraries

| Package | Version | Notes |
|---------|---------|-------|
| numpy | 1.26.4 | ⚠️ **MUST be <2.0 for pyannote compatibility** |
| pandas | 2.3.3 | Data manipulation |
| scipy | 1.17.0 | Scientific computing |
| scikit-learn | 1.8.0 | Machine learning utilities |

### Audio Processing

| Package | Version | Purpose |
|---------|---------|---------|
| librosa | 0.10.2.post1 | Audio analysis |
| soundfile | 0.12.1 | Audio I/O |
| pydub | 0.25.1 | Audio manipulation |
| audioread | 3.1.0 | Audio file reading |
| julius | 0.2.7 | PyTorch audio transforms |
| torch-audiomentations | 0.12.0 | Audio augmentation |
| torch_pitch_shift | 1.2.5 | Pitch shifting |
| soxr | 1.0.0 | High-quality resampling |

### Visualization

| Package | Version |
|---------|---------|
| matplotlib | 3.10.8 |
| pillow | 12.1.0 |
| contourpy | 1.3.3 |

---

## ML Training & Optimization

| Package | Version | Purpose |
|---------|---------|---------|
| optuna | 4.6.0 | Hyperparameter optimization |
| pytorch-metric-learning | 2.9.0 | Metric learning |
| tensorboardX | 2.6.4 | TensorBoard logging |
| numba | 0.63.1 | JIT compilation |

---

## Utilities & Dependencies

### HTTP & Networking

| Package | Version |
|---------|---------|
| requests | 2.32.3 |
| httpx | 0.28.1 |
| httpcore | 1.0.9 |
| aiohttp | 3.13.3 |
| urllib3 | 2.6.3 |
| certifi | 2026.1.4 |

### File & Data Handling

| Package | Version |
|---------|---------|
| huggingface-hub | 0.36.0 |
| fsspec | 2025.12.0 |
| filelock | 3.20.0 |
| safetensors | 0.7.0 |
| pooch | 1.8.2 |
| cloudpathlib | 0.23.0 |

### Configuration & Parsing

| Package | Version |
|---------|---------|
| PyYAML | 6.0.3 |
| omegaconf | 2.3.0 |
| HyperPyYAML | 1.2.3 |
| packaging | 25.0 |

### CLI & UI

| Package | Version |
|---------|---------|
| click | 8.3.1 |
| typer | 0.21.1 |
| rich | 14.2.0 |
| tqdm | 4.67.1 |
| colorlog | 6.10.1 |

---

## Jupyter Environment (Optional)

| Package | Version |
|---------|---------|
| jupyterlab | 4.2.5 |
| notebook | 6.5.5 |
| ipykernel | 6.29.5 |
| ipython | 8.27.0 |
| ipywidgets | 8.1.5 |

---

## Installation Commands

### Quick Install (Recommended)

```bash
# Core web framework
pip install fastapi==0.115.0 uvicorn==0.32.0 python-multipart==0.0.12 python-dotenv==1.0.1

# PyTorch with CUDA 12.1
pip install torch==2.4.1 torchaudio==2.4.1 --index-url https://download.pytorch.org/whl/cu121

# AI Models
pip install openai-whisper==20250625
pip install pyannote.audio==3.1.1
pip install transformers==4.47.1
pip install spacy==3.8.3

# spaCy language model
pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl

# Audio processing
pip install pydub==0.25.1 librosa==0.10.2.post1 soundfile==0.12.1

# Data science (CRITICAL: NumPy must be <2.0)
pip install "numpy<2.0,>=1.26.4" pandas==2.3.3 scipy==1.17.0 scikit-learn==1.8.0
```

---

## Critical Dependencies

### ⚠️ NumPy Version Constraint

**NumPy MUST be version 1.26.x (< 2.0)**

Reason: `pyannote.audio` 3.1.1 is **incompatible** with NumPy 2.x

```bash
pip install "numpy<2.0,>=1.26.4"
```

### PyTorch CUDA Version

PyTorch is compiled with **CUDA 12.1**. Ensure GPU drivers support CUDA 12.1+.

```bash
pip install torch==2.4.1 torchaudio==2.4.1 --index-url https://download.pytorch.org/whl/cu121
```

---

## Full Package List Export

Generated: January 13, 2026

```
aiohappyeyeballs==2.6.1
aiohttp==3.13.3
aiosignal==1.4.0
alembic==1.18.0
annotated-types==0.7.0
antlr4-python3-runtime==4.9.3
anyio==4.12.1
argon2-cffi==23.1.0
argon2-cffi-bindings==21.2.0
arrow==1.3.0
asteroid-filterbanks==0.4.0
asttokens==2.4.1
async-lru==2.0.4
attrs==25.4.0
audioread==3.1.0
babel==2.16.0
beautifulsoup4==4.12.3
bleach==6.1.0
blinker==1.4
blis==1.3.3
catalogue==2.0.10
certifi==2026.1.4
cffi==2.0.0
charset-normalizer==3.3.2
click==8.3.1
cloudpathlib==0.23.0
colorlog==6.10.1
comm==0.2.2
confection==0.1.5
contourpy==1.3.3
cryptography==3.4.8
cycler==0.12.1
cymem==2.0.13
dbus-python==1.2.18
debugpy==1.8.5
decorator==5.1.1
defusedxml==0.7.1
distro==1.7.0
docopt==0.6.2
einops==0.8.1
en_core_web_sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
entrypoints==0.4
executing==2.1.0
fastapi==0.115.0
fastjsonschema==2.20.0
FFM==0.1.0
ffmpeg-python==0.2.0
filelock==3.20.0
fonttools==4.61.1
fqdn==1.5.1
frozenlist==1.8.0
fsspec==2025.12.0
future==1.0.0
greenlet==3.3.0
h11==0.16.0
hf-xet==1.2.0
httpcore==1.0.9
httplib2==0.20.2
httpx==0.28.1
huggingface-hub==0.36.0
HyperPyYAML==1.2.3
idna==3.11
importlib-metadata==4.6.4
ipykernel==6.29.5
ipython==8.27.0
ipython-genutils==0.2.0
ipywidgets==8.1.5
isoduration==20.11.0
jedi==0.19.1
jeepney==0.7.1
Jinja2==3.1.6
joblib==1.5.3
json5==0.9.25
jsonpointer==3.0.0
jsonschema==4.23.0
jsonschema-specifications==2023.12.1
julius==0.2.7
jupyter-archive==3.4.0
jupyter_client==7.4.9
jupyter_contrib_core==0.4.2
jupyter_contrib_nbextensions==0.7.0
jupyter_core==5.7.2
jupyter-events==0.10.0
jupyter-highlight-selected-word==0.2.0
jupyter-lsp==2.2.5
jupyter_nbextensions_configurator==0.6.4
jupyter_server==2.14.2
jupyter_server_terminals==0.5.3
jupyterlab==4.2.5
jupyterlab_pygments==0.3.0
jupyterlab_server==2.27.3
jupyterlab_widgets==3.0.13
keyring==23.5.0
kiwisolver==1.4.9
langcodes==3.5.1
launchpadlib==1.10.16
lazr.restfulclient==0.14.4
lazr.uri==1.0.6
lazy_loader==0.4
librosa==0.10.2.post1
lightning==2.6.0
lightning-utilities==0.15.2
llvmlite==0.46.0
lxml==5.3.0
Mako==1.3.10
markdown-it-py==4.0.0
MarkupSafe==2.1.5
matplotlib==3.10.8
matplotlib-inline==0.1.7
mdurl==0.1.2
mistune==3.0.2
more-itertools==8.10.0
mpmath==1.3.0
msgpack==1.1.2
multidict==6.7.0
murmurhash==1.0.15
nbclassic==1.1.0
nbclient==0.10.0
nbconvert==7.16.4
nbformat==5.10.4
nest-asyncio==1.6.0
networkx==3.6.1
notebook==6.5.5
notebook_shim==0.2.4
numba==0.63.1
numpy==1.26.4
nvidia-cublas-cu12==12.1.3.1
nvidia-cuda-cupti-cu12==12.1.105
nvidia-cuda-nvrtc-cu12==12.1.105
nvidia-cuda-runtime-cu12==12.1.105
nvidia-cudnn-cu12==9.1.0.70
nvidia-cufft-cu12==11.0.2.54
nvidia-cufile-cu12==1.13.1.3
nvidia-curand-cu12==10.3.2.106
nvidia-cusolver-cu12==11.4.5.107
nvidia-cusparse-cu12==12.1.0.106
nvidia-cusparselt-cu12==0.7.1
nvidia-nccl-cu12==2.20.5
nvidia-nvshmem-cu12==3.3.20
nvidia-nvjitlink-cu12==12.9.86
nvidia-nvtx-cu12==12.1.105
oauthlib==3.2.0
omegaconf==2.3.0
openai-whisper==20250625
optuna==4.6.0
overrides==7.7.0
packaging==25.0
pandas==2.3.3
pandocfilters==1.5.1
parso==0.8.4
pexpect==4.9.0
pillow==12.1.0
platformdirs==4.3.6
pooch==1.8.2
preshed==3.0.12
primePy==1.3
prometheus_client==0.21.0
prompt_toolkit==3.0.47
propcache==0.4.1
protobuf==6.33.4
psutil==6.1.0
ptyprocess==0.7.0
pure_eval==0.2.3
pyannote.audio==3.1.1
pyannote-core==6.0.1
pyannote-database==6.1.1
pyannote-metrics==4.0.0
pyannote-pipeline==4.0.0
pycparser==2.23
pydantic==2.10.3
pydantic_core==2.27.1
pydub==0.25.1
Pygments==2.19.2
PyGObject==3.42.1
PyJWT==2.3.0
pyparsing==3.3.1
python-apt==2.4.0+ubuntu4
python-dateutil==2.9.0.post0
python-dotenv==1.0.1
python-json-logger==2.0.7
python-multipart==0.0.12
pytorch-lightning==2.6.0
pytorch-metric-learning==2.9.0
pytz==2025.2
PyYAML==6.0.3
pyzmq==24.0.1
RapidFuzz==3.10.1
referencing==0.35.1
regex==2025.11.3
requests==2.32.3
rfc3339-validator==0.1.4
rfc3986-validator==0.1.1
rich==14.2.0
rpds-py==0.20.0
ruamel.yaml==0.18.17
ruamel.yaml.clib==0.2.15
safetensors==0.7.0
scikit-learn==1.8.0
scipy==1.17.0
SecretStorage==3.3.1
semver==3.0.4
Send2Trash==1.8.3
sentencepiece==0.2.1
setuptools==80.9.0
shellingham==1.5.4
six==1.17.0
smart_open==7.5.0
sniffio==1.3.1
sortedcontainers==2.4.0
soundfile==0.12.1
soupsieve==2.6
soxr==1.0.0
spacy==3.8.3
spacy-legacy==3.0.12
spacy-loggers==1.0.5
speechbrain==1.0.3
SQLAlchemy==2.0.45
srsly==2.5.2
stack-data==0.6.3
starlette==0.38.6
sympy==1.14.0
tabulate==0.9.0
tensorboardX==2.6.4
terminado==0.18.1
thinc==8.3.10
threadpoolctl==3.6.0
tiktoken==0.12.0
tinycss2==1.3.0
tokenizers==0.21.4
torch==2.4.1+cu121
torch-audiomentations==0.12.0
torch_pitch_shift==1.2.5
torchaudio==2.4.1+cu121
torchmetrics==1.8.2
torchvision==0.19.1+cu124
tornado==6.4.1
tqdm==4.67.1
traitlets==5.14.3
transformers==4.47.1
triton==3.0.0
typer==0.21.1
typer-slim==0.21.1
types-python-dateutil==2.9.0.20240906
typing_extensions==4.15.0
tzdata==2025.3
uri-template==1.3.0
urllib3==2.6.3
uvicorn==0.32.0
wadllib==1.3.6
wasabi==1.1.3
wcwidth==0.2.13
weasel==0.4.3
webcolors==24.8.0
webencodings==0.5.1
websocket-client==1.8.0
wheel==0.44.0
widgetsnbextension==4.0.13
wrapt==2.0.1
yarl==1.22.0
zipp==1.0.0
```

---

## Verification Commands

### Check specific package versions:
```bash
pip show numpy torch pyannote.audio transformers spacy
```

### Verify PyTorch CUDA:
```python
import torch
print(f"PyTorch: {torch.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")
print(f"CUDA Version: {torch.version.cuda}")
```

### Verify NumPy version:
```python
import numpy as np
print(f"NumPy: {np.__version__}")
assert np.__version__.startswith('1.'), "NumPy must be <2.0"
```

---

## Notes

1. **NumPy Version**: Critical constraint - must remain <2.0 for pyannote compatibility
2. **PyTorch Build**: Custom CUDA 12.1 build from PyTorch index
3. **GPU Requirements**: Requires CUDA-capable GPU with compute capability 7.0+
4. **Memory Requirements**: Minimum 8GB VRAM recommended, 16GB+ for optimal performance
5. **Python Version**: Tested with Python 3.11

---

## Quality Scoring Factors

The AI service now includes comprehensive quality scoring based on six critical factors:

### 1. **Customer Tone Analysis (25 points)**
- Detects positive, neutral, frustrated, or angry customer sentiment
- Uses sentiment analysis on customer speech segments
- Identifies frustration indicators (e.g., "frustrated", "annoyed", "ridiculous")
- Flags calls with angry or frustrated customers

### 2. **Language Selection (10 points)**
- Awards points based on detected language
- English: 10 points (expected language)
- Spanish/French/German: 8 points
- Other languages: 5 points

### 3. **Agent Casual/Informal Language Detection (25 points)**
- Detects unprofessional casual phrases by agents
- Examples: "yeah", "gonna", "wanna", "umm", "whatever", "no worries", "my bad"
- Penalizes excessive casual language
- Flags agents who are too casual in communication

### 4. **Customer Communication Style (20 points)**
- Analyzes how customers communicate
- Polite: Uses "please", "thank you", "appreciate" (20 points)
- Neutral: Standard communication (15 points)
- Assertive: Uses "demand", "immediately" (8 points)
- Aggressive: Uses harsh language (0 points)

### 5. **Abusive Language Detection (Heavy Penalty)**
- Detects profanity and abusive words
- Penalty: -10 points per abusive word (max -30 points)
- Critical for compliance and call quality monitoring

### 6. **DNC (Do Not Call) Customer Detection (Critical Flag)**
- Detects phrases like:
  - "do not call", "don't call", "stop calling"
  - "remove from list", "take me off", "no more calls"
  - "not interested", "unsubscribe"
- Penalty: -20 points (compliance issue)
- Flags call as DNC for regulatory compliance

### Scoring Range
- **Overall Score**: 0-100
- **Excellent**: 90-100 (professional, positive interaction)
- **Good**: 70-89 (acceptable with minor issues)
- **Fair**: 50-69 (needs improvement)
- **Poor**: Below 50 (significant issues, violations, or DNC)

### API Endpoint
```
POST /calculate-quality-score
```

**Request Body:**
```json
{
  "transcript": "Full call transcript",
  "speaker_labeled_transcript": "SPEAKER_00: Hello...\nSPEAKER_01: Hi...",
  "detected_language": "english"
}
```

**Response:**
```json
{
  "overall_score": 85.0,
  "factors": {
    "customer_tone_score": 25,
    "language_score": 10,
    "agent_professionalism_score": 20,
    "customer_communication_score": 15,
    "abusive_language_penalty": 0,
    "dnc_penalty": 0
  },
  "details": {
    "customer_tone": "positive",
    "detected_language": "english",
    "agent_casual_phrases": ["yeah", "no worries"],
    "customer_style": "neutral",
    "abusive_words_found": [],
    "dnc_phrases_found": []
  },
  "flags": {
    "has_abusive_language": false,
    "is_dnc_customer": false,
    "agent_too_casual": true,
    "customer_frustrated": false
  }
}
```

---

## Troubleshooting

### If NumPy 2.x gets installed:
```bash
pip install --force-reinstall "numpy<2.0,>=1.26.4"
```

### If PyTorch CUDA is not detected:
```bash
pip uninstall torch torchaudio torchvision
pip install torch==2.4.1 torchaudio==2.4.1 --index-url https://download.pytorch.org/whl/cu121
```

### If pyannote.audio fails to load:
```bash
pip install --force-reinstall pyannote.audio==3.1.1
```































Tone of the customer, Language selection, Casual talking by the agents, Customer's way of talking, Abusive Language, DNC Customer (Donot call)