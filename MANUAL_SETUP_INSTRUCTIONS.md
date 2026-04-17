# ORCA-MINI INSTALLATION - MANUAL STEPS

## Problem Summary
- ✗ Network blocks registry.ollama.ai (ports 80/443)
- ✗ Cannot download from Hugging Face automatically  
- ✓ Model file needs to be obtained manually on another network

## Steps to Complete

### Step 1: Get the Model File
Since your network blocks Hugging Face downloads, you need to **use a different device/network**:

**Option A: Use your phone hotspot or another computer**
1. Go to: https://huggingface.co/TheBloke/orca_mini_v3_7B-GGUF
2. Download: `orca_mini_v3_7b.Q3_K_S.gguf` (2.95 GB)
3. Transfer to your computer via USB or cloud storage

**Option B: Download on another network and transfer**
- Use a coffee shop WiFi, mobile hotspot, etc.
- Download to external USB drive
- Transfer to this computer

### Step 2: Place the File
After downloading, save it to one of these locations:
```
C:\Users\VIP INFO\Downloads\orca_mini_v3_7b.Q3_K_S.gguf
C:\Users\VIP INFO\Desktop\orca_mini_v3_7b.Q3_K_S.gguf
C:\Users\VIP INFO\Desktop\mon-projet\orca_mini_v3_7b.Q3_K_S.gguf
```

### Step 3: Run Setup
Once the file is in place, run:
```powershell
cd C:\Users\VIP INFO\Desktop\mon-projet
python setup_orca_mini.py
```

The script will automatically:
- Find your model file
- Copy it to Ollama's directory
- Register it with Ollama
- Configure it for use

### Step 4: Verify Installation
```powershell
ollama list
```

Should show:
```
orca-mini  7b  3.0GB
```

### Step 5: Test
```powershell
ollama run orca-mini "Hello world"
```

## Alternative: Manual Setup If Script Fails

If the script doesn't work, do this manually:

```powershell
# 1. Copy model to Ollama directory
copy "C:\path\to\orca_mini_v3_7b.Q3_K_S.gguf" "$env:USERPROFILE\.ollama\models\blobs\"

# 2. Create Modelfile
$modelContent = @"
FROM $env:USERPROFILE\.ollama\models\blobs\orca_mini_v3_7b.Q3_K_S.gguf
TEMPLATE "[INST] {{ .Prompt }} [/INST]"
PARAMETER top_k 40
PARAMETER top_p 0.9
PARAMETER temperature 0.8
PARAMETER num_predict 256
"@

$modelContent | Out-File -FilePath "C:\Users\VIP INFO\Desktop\mon-projet\Modelfile-orca-mini" -Encoding UTF8

# 3. Register with Ollama
cd C:\Users\VIP INFO\Desktop\mon-projet
ollama create orca-mini -f Modelfile-orca-mini
```

## What to Do Now

1. **Get the file** from Hugging Face using a different network
2. **Place it** in one of the locations above
3. **Send a message** when file is ready and I'll complete the setup

Interactive setup is still waiting - you can type the full path when ready:
```
C:\path\to\orca_mini_v3_7b.Q3_K_S.gguf
```
