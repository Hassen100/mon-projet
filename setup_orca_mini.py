#!/usr/bin/env python3
"""
Ollama Orca Mini Setup Script
Downloads and configures orca-mini for local use when registry is blocked.
"""

import os
import json
import shutil
from pathlib import Path
import subprocess

def setup_orca_mini_local():
    """Setup orca-mini model locally in Ollama"""
    
    home = Path.home()
    ollama_models = home / ".ollama" / "models"
    blobs_dir = ollama_models / "blobs"
    manifests_dir = ollama_models / "manifests" / "registry.ollama.ai" / "library" / "orca-mini"
    
    # Create directories
    blobs_dir.mkdir(parents=True, exist_ok=True)
    manifests_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 70)
    print("OLLAMA ORCA-MINI LOCAL SETUP")
    print("=" * 70)
    print()
    
    # Step 1: Find the model file
    print("STEP 1: Looking for downloaded orca-mini model file...")
    print()
    
    model_file = None
    search_paths = [
        home / "Downloads",
        home / "Desktop",
        Path.cwd(),
        home,
    ]
    
    for search_path in search_paths:
        if search_path.exists():
            for file in search_path.glob("*orca*mini*.gguf"):
                model_file = file
                print(f"✓ Found model: {file}")
                break
        if model_file:
            break
    
    if not model_file:
        print("✗ Model file not found!")
        print()
        print("Please download orca-mini from:")
        print("https://huggingface.co/TheBloke/orca_mini_v3_7B-GGUF")
        print()
        print("Then place the .gguf file in:")
        print(f"- {home / 'Downloads'}")
        print(f"- {home / 'Desktop'}")
        print(f"- {Path.cwd()}")
        print()
        return False
    
    # Step 2: Copy to Ollama blobs
    print()
    print("STEP 2: Copying model to Ollama blobs directory...")
    dest_file = blobs_dir / model_file.name
    
    if dest_file.exists():
        print(f"  Model already exists at {dest_file}")
    else:
        print(f"  Copying {model_file.name}...")
        shutil.copy2(model_file, dest_file)
        print(f"✓ Copied to {dest_file}")
    
    # Step 3: Create Modelfile
    print()
    print("STEP 3: Creating Modelfile...")
    modelfile_path = Path.cwd() / "Modelfile-orca-mini"
    modelfile_content = f"""FROM {dest_file}
TEMPLATE "[INST] {{{{ .Prompt }}}} [/INST]"
PARAMETER top_k 40
PARAMETER top_p 0.9
PARAMETER temperature 0.8
PARAMETER num_predict 256
"""
    
    with open(modelfile_path, 'w') as f:
        f.write(modelfile_content)
    print(f"✓ Created {modelfile_path}")
    
    # Step 4: Create the model in Ollama
    print()
    print("STEP 4: Creating model in Ollama...")
    print()
    
    try:
        result = subprocess.run(
            ["ollama", "create", "orca-mini", "-f", str(modelfile_path)],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✓ Model created successfully!")
            print()
            print("=" * 70)
            print("SETUP COMPLETE!")
            print("=" * 70)
            print()
            print("You can now use orca-mini:")
            print("  ollama run orca-mini")
            print()
            return True
        else:
            print(f"✗ Error creating model:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    setup_orca_mini_local()
