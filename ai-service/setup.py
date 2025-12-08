"""
Setup script for AI Service - Downloads required FREE models
"""

import subprocess
import sys

def run_command(command, description):
    """Run a command and print status"""
    print(f"\n{'='*60}")
    print(f"🔄 {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ {description} - SUCCESS")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - FAILED")
        print(f"Error: {e.stderr}")
        return False

def main():
    """Download all required FREE & open-source models"""
    
    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🤖 AI Service Setup - FREE & Open-Source Models            ║
    ║                                                               ║
    ║   This script will download the following FREE models:        ║
    ║                                                               ║
    ║   1. spaCy English model (en_core_web_sm) - ~12MB            ║
    ║   2. Whisper models (auto-downloaded on first use)           ║
    ║   3. DistilBERT (auto-downloaded from Hugging Face)          ║
    ║   4. BART (auto-downloaded from Hugging Face)                ║
    ║                                                               ║
    ║   Total download: ~500MB-1GB (one-time setup)                ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)
    
    success_count = 0
    total_tasks = 2
    
    # 1. Download spaCy model
    if run_command(
        f"{sys.executable} -m spacy download en_core_web_sm",
        "Downloading spaCy English model (en_core_web_sm)"
    ):
        success_count += 1
    
    # 2. Verify installations
    print("\n" + "="*60)
    print("🔍 Verifying installations...")
    print("="*60)
    
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        print("✅ spaCy model loaded successfully")
        success_count += 1
    except Exception as e:
        print(f"❌ spaCy model verification failed: {e}")
    
    # Summary
    print("\n" + "="*60)
    print(f"📊 Setup Summary: {success_count}/{total_tasks} tasks completed")
    print("="*60)
    
    if success_count == total_tasks:
        print("""
    ✅ ALL MODELS READY!
    
    Next steps:
    1. Make sure .env file is configured
    2. Run: python main.py
    3. API will auto-download Whisper/BART/DistilBERT on first use
    
    Note: Whisper 'medium' model (~1.5GB) will download automatically
          on first transcription request. This is normal and only
          happens once.
        """)
    else:
        print("""
    ⚠️  Some models failed to install.
    
    Manual installation:
    - spaCy: python -m spacy download en_core_web_sm
    
    Then run this script again to verify.
        """)

if __name__ == "__main__":
    main()
