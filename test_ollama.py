#!/usr/bin/env python
"""Test Ollama API connectivity and response"""
import requests
import json

print("Testing Ollama connectivity...")

try:
    # Test 1: Check if Ollama is accessible
    print("\n1. Testing /api/tags endpoint...")
    resp = requests.get('http://localhost:11434/api/tags', timeout=5)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        tags = resp.json()
        print(f"   Available models: {[m.get('name') for m in tags.get('models', [])]}")
    
    # Test 2: Send a simple prompt
    print("\n2. Testing /api/generate endpoint with simple prompt...")
    payload = {
        'model': 'orca-mini',
        'prompt': 'Say hello',
        'stream': False
    }
    resp = requests.post('http://localhost:11434/api/generate', json=payload, timeout=60)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        response_text = data.get('response', 'NO RESPONSE')
        print(f"   Response: {response_text[:100]}")
    else:
        print(f"   Error: {resp.text}")
    
    print("\n✅ Ollama is working!")
    
except requests.Timeout as e:
    print(f"   ❌ Timeout: {e}")
except requests.ConnectionError as e:
    print(f"   ❌ Connection error: {e}")
except Exception as e:
    print(f"   ❌ Error: {e}")
