#!/usr/bin/env python
"""Test Django AI endpoint"""
import requests
import json

print("Testing Django AI endpoint...")

try:
    # Test the AI chat endpoint
    print("\n1. Testing POST /api/ai/chat/...")
    payload = {
        'message': 'hello',
        'days': 30
    }
    
    resp = requests.post('http://127.0.0.1:8000/api/ai/chat/', json=payload, timeout=60)
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {resp.text[:200]}")
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"   ✅ Success: {data.get('response', 'N/A')[:100]}")
    else:
        print(f"   ❌ Error: {resp.text}")
    
except requests.Timeout:
    print("   ❌ Timeout after 60s")
except Exception as e:
    print(f"   ❌ Error: {e}")
