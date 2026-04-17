#!/usr/bin/env python
"""Test HybridAI Service"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, 'c:\\Users\\VIP INFO\\Desktop\\mon-projet\\backend')
django.setup()

from api.hybrid_ai_service import HybridAIService

service = HybridAIService()
status = service.get_status()

print('=' * 50)
print('🤖 AI SERVICES HYBRID STATUS')
print('=' * 50)
print()

print('📍 Ollama (Local & Free):')
print(f'   Available: {status["ollama"]["available"]}')
print(f'   URL: {status["ollama"]["url"]}')
print(f'   Model: {status["ollama"]["model"]}')
print()

print('☁️  Gemini (Cloud):')
print(f'   Available: {status["gemini"]["available"]}')
print(f'   Provider: {status["gemini"]["provider"]}')
print()

ollama_ok = status["ollama"]["available"]
gemini_ok = status["gemini"]["available"]

if ollama_ok and gemini_ok:
    print('✅ HYBRID MODE: Both services available!')
    print('   Mode "auto": Will use Ollama, fallback to Gemini')
    recommended = 'OLLAMA (faster, local)'
elif ollama_ok:
    print('✅ LOCAL MODE: Using Ollama only')
    recommended = 'OLLAMA (local, free)'
elif gemini_ok:
    print('⚠️  CLOUD MODE: Using Gemini only')
    recommended = 'GEMINI (cloud)'
else:
    print('❌ ERROR: No AI services available!')
    recommended = 'NONE'

print()
print(f'📊 Recommended: {recommended}')
print()
