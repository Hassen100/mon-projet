#!/usr/bin/env python
"""Test: Can AI respond to all types of messages?"""
import requests

base = 'http://127.0.0.1:8000'

# Login
r = requests.post(base + '/api/login/', 
    json={'username': 'admin', 'password': 'admin'}, timeout=5)
token = r.json().get('token', '')
headers = {'Authorization': f'Token {token}'}

print('🧪 TEST: Different Message Types')
print('=' * 70)

messages = [
    'hello',
    'Hello world',
    'Bonjour',
    'Comment ca va ?',
    '123',
    'test',
    'aide moi',
    'ok',
    'qua?',
    'pourquoi?',
]

pass_count = 0
fail_count = 0

for msg in messages:
    try:
        display = msg if len(msg) < 40 else msg[:37] + '...'
        print(f'\nMessage: "{display}"')
        
        r = requests.post(base + '/api/ai/chat/',
            json={'message': msg, 'days': 7},
            headers=headers, timeout=15)
        
        if r.status_code == 200:
            data = r.json()
            response = data.get('response', '')
            response_preview = response[:100] if response else '(empty)'
            print(f'   ✅ Status 200')
            print(f'   Response: {response_preview}...')
            pass_count += 1
        else:
            print(f'   ❌ Status {r.status_code}')
            fail_count += 1
    except Exception as e:
        print(f'   ❌ Exception: {str(e)[:60]}')
        fail_count += 1

print('\n' + '=' * 70)
print(f'RESULTS: {pass_count} PASSED | {fail_count} FAILED')
print('=' * 70)

if pass_count == len(messages):
    print('\n✅ YES! The AI responds to ALL types of messages!')
    print('Including: hello, simple text, numbers, short messages, etc.')
else:
    print(f'\n⚠️  Only {pass_count}/{len(messages)} messages got responses')
