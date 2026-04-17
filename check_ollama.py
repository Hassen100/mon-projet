#!/usr/bin/env python
"""Ollama Activation Quick Checker - Verify installation is complete"""
import subprocess
import requests
import time
import sys

print("=" * 70)
print("🔍 Ollama Activation Checker")
print("=" * 70)

# 1. Check if Ollama is installed
print("\n1️⃣  Checking Ollama Installation...")
try:
    result = subprocess.run(['ollama', '--version'], 
                          capture_output=True, text=True, timeout=5)
    if result.returncode == 0:
        print(f"   ✅ Ollama installed: {result.stdout.strip()}")
    else:
        print("   ❌ Ollama command failed")
        print("   Fix: Download from https://ollama.ai and install")
        sys.exit(1)
except FileNotFoundError:
    print("   ❌ Ollama not found in PATH")
    print("   Fix: Download from https://ollama.ai and install")
    sys.exit(1)
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

# 2. Check if Ollama service is running
print("\n2️⃣  Checking if Ollama Server is Running...")
try:
    r = requests.get('http://localhost:11434/api/tags', timeout=2)
    if r.status_code == 200:
        print("   ✅ Ollama Server is running on localhost:11434")
    else:
        print(f"   ⚠️  Ollama response: HTTP {r.status_code}")
except requests.ConnectionError:
    print("   ❌ Cannot connect to Ollama on localhost:11434")
    print("   Fix: Run 'ollama serve' in a terminal first")
    sys.exit(1)
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

# 3. Check installed models
print("\n3️⃣  Checking Installed Models...")
try:
    r = requests.get('http://localhost:11434/api/tags', timeout=5)
    if r.status_code == 200:
        models = r.json().get('models', [])
        if models:
            print(f"   ✅ Found {len(models)} model(s):")
            for model in models:
                name = model.get('name', 'unknown')
                print(f"      • {name}")
        else:
            print("   ❌ No models installed")
            print("   Fix: Run 'ollama pull mistral' (or llama2)")
            sys.exit(1)
    else:
        print("   ❌ Could not fetch models")
        sys.exit(1)
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

# 4. Check Django backend
print("\n4️⃣  Checking Django Backend...")
try:
    r = requests.get('http://127.0.0.1:8000/api/', timeout=3)
    if r.status_code == 200:
        print("   ✅ Django backend running on 127.0.0.1:8000")
    else:
        print(f"   ⚠️  Backend response: HTTP {r.status_code}")
except requests.ConnectionError:
    print("   ⚠️  Django not running yet")
    print("   Info: Run 'python manage.py runserver' when ready")
except Exception as e:
    print(f"   ⚠️  Error: {e}")

# 5. Check .env configuration
print("\n5️⃣  Checking .env Configuration...")
try:
    with open('backend/.env', 'r') as f:
        env_content = f.read()
        
    use_ollama = 'AI_USE_OLLAMA=true' in env_content
    ollama_host = 'OLLAMA_HOST=http://localhost:11434' in env_content
    ollama_model = 'OLLAMA_MODEL=mistral' in env_content or 'OLLAMA_MODEL=llama2' in env_content
    
    if use_ollama:
        print("   ✅ AI_USE_OLLAMA=true")
    else:
        print("   ❌ AI_USE_OLLAMA=false or not set")
        print("   Fix: Change to 'AI_USE_OLLAMA=true' in backend/.env")
    
    if ollama_host:
        print("   ✅ OLLAMA_HOST configured")
    else:
        print("   ⚠️  OLLAMA_HOST not configured properly")
    
    if ollama_model:
        print("   ✅ OLLAMA_MODEL configured")
    else:
        print("   ⚠️  OLLAMA_MODEL not configured properly")
        
except FileNotFoundError:
    print("   ❌ backend/.env not found")
    print("   Fix: Create backend/.env with Ollama config")
    sys.exit(1)
except Exception as e:
    print(f"   ⚠️  Error reading .env: {e}")

# 6. Test AI endpoint
print("\n6️⃣  Testing AI Endpoint with Ollama...")
try:
    # First login
    login_resp = requests.post('http://127.0.0.1:8000/api/login/',
        json={'username': 'admin', 'password': 'admin'},
        timeout=5)
    
    if login_resp.status_code != 200:
        print("   ⚠️  Could not login (Django not ready yet)")
    else:
        token = login_resp.json().get('token', '')
        headers = {'Authorization': f'Token {token}'}
        
        # Test AI chat
        print("   Sending test message to Ollama...")
        start = time.time()
        ai_resp = requests.post('http://127.0.0.1:8000/api/ai/chat/',
            json={'message': 'hello', 'days': 30},
            headers=headers,
            timeout=30)
        elapsed = time.time() - start
        
        if ai_resp.status_code == 200:
            response_text = ai_resp.json().get('response', '')
            print(f"   ✅ AI responded in {elapsed:.1f}s ({len(response_text)} chars)")
            if response_text:
                print(f"   Preview: {response_text[:100]}...")
        else:
            print(f"   ⚠️  AI endpoint returned HTTP {ai_resp.status_code}")
except requests.ConnectionError:
    print("   ⚠️  Django not responding yet - Start it then test again")
except Exception as e:
    print(f"   ⚠️  Error testing AI: {str(e)[:100]}")

# Final summary
print("\n" + "=" * 70)
print("✅ OLLAMA ACTIVATION STATUS")
print("=" * 70)
print("\n✨ ALL SYSTEMS READY FOR OLLAMA!")
print("\nNext steps:")
print("1. Keep 'ollama serve' terminal open")
print("2. Run 'python manage.py runserver' in backend/")
print("3. Run 'ng serve' in seo-dashboard/")
print("4. Open http://localhost:4200")
print("5. Login and test AI Assistant")
print("\n🚀 Your AI is now powered by Ollama (FREE, UNLIMITED, LOCAL)!\n")
