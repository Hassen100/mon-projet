#!/usr/bin/env python3
"""
Download and setup orca-mini directly from Hugging Face
"""

import os
import subprocess
import requests
from pathlib import Path

def download_orca_mini():
    """Download orca-mini from Hugging Face"""
    
    print("=" * 70)
    print("ORCA-MINI AUTO DOWNLOADER")
    print("=" * 70)
    print()
    
    url = "https://huggingface.co/TheBloke/orca_mini_v3_7B-GGUF/resolve/main/orca_mini_v3_7b.Q3_K_S.gguf"
    
    downloads_dir = Path.home() / "Downloads"
    downloads_dir.mkdir(exist_ok=True)
    
    output_file = downloads_dir / "orca_mini_v3_7b.Q3_K_S.gguf"
    
    print(f"Downloading from: {url}")
    print(f"Saving to: {output_file}")
    print()
    
    if output_file.exists():
        print(f"✓ File already exists: {output_file}")
        print(f"  Size: {output_file.stat().st_size / (1024**3):.2f} GB")
        return output_file
    
    try:
        response = requests.get(url, stream=True, timeout=30)
        
        if response.status_code != 200:
            print(f"✗ Download failed with status {response.status_code}")
            return None
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(output_file, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        size_mb = downloaded / (1024**2)
                        total_mb = total_size / (1024**2)
                        print(f"\rDownloading: {percent:.1f}% ({size_mb:.0f}MB / {total_mb:.0f}MB)", end='', flush=True)
        
        print()
        print(f"✓ Download complete!")
        return output_file
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Download error: {e}")
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

if __name__ == "__main__":
    model_path = download_orca_mini()
    
    if model_path:
        print()
        print("=" * 70)
        print("Next step:")
        print("=" * 70)
        print()
        print("Run this command to setup:")
        print(f"  python setup_orca_mini.py")
        print()
    else:
        print("Download failed. Check your internet connection.")
