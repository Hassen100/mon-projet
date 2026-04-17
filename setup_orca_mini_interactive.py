#!/usr/bin/env python3
"""
Interactive Orca Mini Setup - Asks user for file location
"""

import os
import shutil
from pathlib import Path
import subprocess

def find_model_or_ask():
    """Find model file or ask user for location"""
    
    print("=" * 70)
    print("ORCA-MINI SETUP - FINDING MODEL FILE")
    print("=" * 70)
    print()
    
    home = Path.home()
    
    # Common locations to check
    common_paths = [
        home / "Downloads",
        home / "Desktop", 
        Path.cwd(),
        home,
    ]
    
    # Search
    found_files = []
    for search_path in common_paths:
        if search_path.exists():
            for file in search_path.glob("*orca*.gguf"):
                found_files.append(file)
    
    if found_files:
        print(f"Found {len(found_files)} orca model file(s):")
        for i, f in enumerate(found_files, 1):
            size_mb = f.stat().st_size / (1024*1024)
            print(f"  {i}. {f.name} ({size_mb:.1f} MB)")
            print(f"     {f}")
        print()
        
        choice = input("Select file number (or paste full path): ").strip()
        
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(found_files):
                return found_files[idx]
        except ValueError:
            pass
        
        # User provided path
        model_path = Path(choice)
        if model_path.exists() and model_path.suffix == ".gguf":
            return model_path
    
    # Ask user
    print("No model file found automatically.")
    print()
    print("Please provide the full path to orca_mini_v3_7b.Q3_K_S.gguf:")
    print("(e.g., C:\\Users\\VIP INFO\\Downloads\\orca_mini_v3_7b.Q3_K_S.gguf)")
    print()
    
    path_input = input("File path: ").strip()
    model_path = Path(path_input)
    
    if not model_path.exists():
        print(f"✗ File not found: {model_path}")
        return None
    
    if model_path.suffix != ".gguf":
        print(f"✗ File must be .gguf format, got: {model_path.suffix}")
        return None
    
    return model_path

def setup_model(model_path):
    """Setup the model in Ollama"""
    
    home = Path.home()
    ollama_models = home / ".ollama" / "models"
    blobs_dir = ollama_models / "blobs"
    
    print()
    print("=" * 70)
    print("SETTING UP MODEL")
    print("=" * 70)
    print()
    
    # Create directories
    blobs_dir.mkdir(parents=True, exist_ok=True)
    print(f"✓ Ollama models directory ready: {blobs_dir}")
    print()
    
    # Copy model
    dest_file = blobs_dir / model_path.name
    print(f"Copying model...")
    print(f"  From: {model_path}")
    print(f"  To:   {dest_file}")
    print()
    
    try:
        shutil.copy2(model_path, dest_file)
        print(f"✓ Model copied successfully")
    except Exception as e:
        print(f"✗ Error copying: {e}")
        return False
    
    # Create Modelfile
    print()
    print("Creating Modelfile...")
    modelfile_path = Path.cwd() / "Modelfile-orca-mini"
    modelfile_content = f"""FROM {dest_file}
TEMPLATE "[INST] {{{{ .Prompt }}}} [/INST]"
PARAMETER top_k 40
PARAMETER top_p 0.9
PARAMETER temperature 0.8
PARAMETER num_predict 256
"""
    
    try:
        with open(modelfile_path, 'w') as f:
            f.write(modelfile_content)
        print(f"✓ Created Modelfile: {modelfile_path}")
    except Exception as e:
        print(f"✗ Error creating Modelfile: {e}")
        return False
    
    # Register with Ollama
    print()
    print("Registering model with Ollama...")
    print("  Running: ollama create orca-mini -f Modelfile-orca-mini")
    print()
    
    try:
        result = subprocess.run(
            ["ollama", "create", "orca-mini", "-f", str(modelfile_path)],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            print("✓ Model registered successfully!")
            if result.stdout:
                print(f"\n{result.stdout}")
            
            print()
            print("=" * 70)
            print("✓ SETUP COMPLETE!")
            print("=" * 70)
            print()
            print("You can now use orca-mini:")
            print("  ollama run orca-mini")
            print()
            print("Or in your application:")
            print("  from ollama import Client")
            print("  client = Client()")
            print("  response = client.generate('orca-mini', 'Your prompt here')")
            print()
            return True
        else:
            print(f"✗ Error: {result.stderr}")
            return False
    
    except subprocess.TimeoutExpired:
        print("✗ Setup timed out")
        return False
    except Exception as e:
        print(f"✗ Error registering model: {e}")
        return False

if __name__ == "__main__":
    model_path = find_model_or_ask()
    
    if model_path:
        success = setup_model(model_path)
        if not success:
            print("\nSetup failed. Please check the errors above.")
    else:
        print("\n✗ No valid model file provided.")
