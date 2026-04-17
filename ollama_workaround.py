#!/usr/bin/env python3
"""
Ollama orca-mini Installation Workaround
Network is blocked (ports 80/443), so manual download is required.
"""

import os
import sys
from pathlib import Path

def setup_orca_mini():
    """
    Setup orca-mini model for Ollama when registry.ollama.ai is blocked.
    
    Steps:
    1. Download orca-mini.gguf from an alternative source
    2. Place it in the Ollama models directory
    3. Create a Modelfile entry
    """
    
    ollama_models_dir = Path.home() / ".ollama" / "models"
    blobs_dir = ollama_models_dir / "blobs"
    
    print("=" * 60)
    print("OLLAMA ORCA-MINI INSTALLATION WORKAROUND")
    print("=" * 60)
    print()
    print(f"Ollama models directory: {ollama_models_dir}")
    print(f"Blobs directory: {blobs_dir}")
    print()
    
    print("PROBLEM: Registry is blocked (ports 80/443)")
    print()
    
    print("SOLUTION - Download manually and place model:")
    print()
    print("1. Download orca-mini from one of these sources:")
    print("   - Hugging Face: https://huggingface.co/search?q=orca-mini+gguf")
    print("   - Civitai: https://civitai.com/")
    print("   - GGML models: https://huggingface.co/models?search=orca-mini")
    print()
    
    print("2. Place the .gguf file in:")
    print(f"   {blobs_dir}")
    print()
    
    print("3. Create a Modelfile at:")
    modelfile_path = Path.home() / "Desktop" / "mon-projet" / "Modelfile-orca-mini"
    print(f"   {modelfile_path}")
    print()
    
    print("4. Then run:")
    print("   ollama create orca-mini -f Modelfile-orca-mini")
    print()
    
    print("ALTERNATIVE: Use an alternative model that's easier to get:")
    print("   - Try: ollama pull tinyllama (smaller, more likely to work)")
    print("   - Try: ollama pull neural-chat")
    print()
    
    print("=" * 60)

if __name__ == "__main__":
    setup_orca_mini()
