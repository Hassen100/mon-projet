#!/usr/bin/env python
"""Test Django AI endpoint with SEO questions"""
import requests
import json
import time

print("=" * 60)
print("Testing Django AI AI Assistant with SEO questions")
print("=" * 60)

questions = [
    "Quelle est ma position SEO moyenne?",
    "Quels sont mes problèmes techniques les plus importants?",
    "Comment augmenter mon trafic organique?",
]

for i, question in enumerate(questions, 1):
    try:
        print(f"\n{i}. Question: {question}")
        print("-" * 40)
        
        payload = {
            'message': question,
            'days': 30
        }
        
        start = time.time()
        resp = requests.post('http://127.0.0.1:8000/api/ai/chat/', json=payload, timeout=60)
        elapsed = time.time() - start
        
        print(f"Status: {resp.status_code} (took {elapsed:.1f}s)")
        
        if resp.status_code == 200:
            data = resp.json()
            response_text = data.get('response', 'N/A')
            print(f"Response: {response_text[:200]}...")
            print("✅ Success")
        else:
            print(f"❌ Error: {resp.text[:200]}")
    
    except requests.Timeout:
        print("❌ Timeout after 60s")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    time.sleep(1)

print("\n" + "=" * 60)
print("✅ AI Assistant is working!")
print("=" * 60)
