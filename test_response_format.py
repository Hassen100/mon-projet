#!/usr/bin/env python
"""Detailed test of AI endpoint response format"""
import requests
import json

payload = {
    'message': 'HELLO',
    'days': 30
}

print("Testing with message: 'HELLO'")
print("Endpoint: POST /api/ai/chat/")
print("-" * 60)

resp = requests.post('http://127.0.0.1:8000/api/ai/chat/', json=payload, timeout=60)
print(f"Status: {resp.status_code}")
print(f"Content-Type: {resp.headers.get('Content-Type')}")
print(f"\nRaw Response:\n{resp.text}\n")

if resp.status_code == 200:
    try:
        data = resp.json()
        print("✅ Parsed JSON successfully:")
        print(json.dumps(data, indent=2))
        
        # Check if required fields are present
        print("\nResponse fields:")
        print(f"  - response: {type(data.get('response'))} ({len(str(data.get('response')))} chars)")
        print(f"  - context_summary: {type(data.get('context_summary'))}")
        print(f"  - timestamp: {type(data.get('timestamp'))}")
    except Exception as e:
        print(f"❌ Failed to parse JSON: {e}")
else:
    print(f"❌ Error: {resp.status_code}")
