# Orca Mini Installation Guide

## Current Situation
- Network blocks ports 80/443 to registry.ollama.ai
- Must download model manually and import locally

## Solution: Q4_K_S Version (Recommended)

### Step 1: Download the Model
1. Go to: https://huggingface.co/TheBloke/orca_mini_v3_7B-GGUF
2. Click on **Q4_K_S** (3.86 GB) - best balance of size/quality
3. Download the `.gguf` file
4. Wait for download to complete

### Step 2: Run Setup Script
Once downloaded, run this command:

```powershell
cd C:\Users\VIP INFO\Desktop\mon-projet
python setup_orca_mini.py
```

The script will:
- Find your downloaded model file
- Copy it to Ollama's models directory
- Create a Modelfile
- Register it with Ollama

### Step 3: Use the Model
After setup completes:

```powershell
ollama run orca-mini
```

## Alternative: Manual Setup

If the script doesn't work:

1. Download model to: `C:\Users\VIP INFO\Downloads\orca-mini-q4.gguf`

2. Copy to Ollama:
```powershell
copy "C:\Users\VIP INFO\Downloads\orca-mini-q4.gguf" "$env:USERPROFILE\.ollama\models\blobs\"
```

3. Create Modelfile:
```
FROM C:\Users\VIP INFO\.ollama\models\blobs\orca-mini-q4.gguf
TEMPLATE "[INST] {{ .Prompt }} [/INST]"
PARAMETER top_k 40
PARAMETER top_p 0.9
PARAMETER temperature 0.8
```

4. Register:
```powershell
ollama create orca-mini -f Modelfile-orca-mini
```

## Sizes Reference
- **Q3_K_S**: 2.95 GB (fastest, less accurate)
- **Q4_K_S**: 3.86 GB ⭐ (recommended, best balance)
- **Q5_K_S**: 4.65 GB (higher quality)
- **Q8_0**: 7.16 GB (best quality, slowest)

## Verify Installation
```powershell
ollama list
```

Should show: `orca-mini  7b  3.9GB`

## Test Run
```powershell
ollama run orca-mini "Hello, what is your name?"
```
