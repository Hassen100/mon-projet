#!/usr/bin/env python
"""Test AI loading message fix"""
import requests
import time

base = 'http://127.0.0.1:8000'

# Login
print('Logging in...')
r = requests.post(base + '/api/login/', json={'username': 'admin', 'password': 'admin'}, timeout=5)
token = r.json().get('token', '')
headers = {'Authorization': f'Token {token}'}

print('\n' + '=' * 70)
print('TEST: Message "hello" + Loading State Fix')
print('=' * 70)

# Test 1: Send "hello"
print('\n1. Sending message: "hello"')
start = time.time()
r = requests.post(base + '/api/ai/chat/', 
    json={'message': 'hello', 'days': 7},
    headers=headers, timeout=20)
elapsed = time.time() - start

print(f'   HTTP Status: {r.status_code}')
print(f'   Response Time: {elapsed:.2f}s')

if r.status_code == 200:
    data = r.json()
    response = data.get('response', '')
    print(f'   Response Length: {len(response)} chars')
    
    # Check if loading message is in response
    if 'Analyse en cours' in response:
        print('   ❌ ERROR: Loading message still in response!')
        print(f'   Response: {response[:200]}')
    else:
        print('   ✅ SUCCESS: No loading message in response')
        print(f'\n   Response preview:\n   {response[:250]}...')
else:
    print(f'   ERROR: {r.text}')

# Test 2: Multiple messages to ensure state is clean
print('\n2. Testing state cleanup with multiple messages')
for i in range(2):
    print(f'   Message {i+1}...')
    start = time.time()
    r = requests.post(base + '/api/ai/chat/', 
        json={'message': f'test {i+1}', 'days': 7},
        headers=headers, timeout=20)
    elapsed = time.time() - start
    
    if r.status_code == 200:
        response = r.json().get('response', '')
        if 'Analyse en cours' not in response:
            print(f'      ✅ OK ({elapsed:.2f}s, {len(response)} chars)')
        else:
            print(f'      ❌ FAIL: Loading message present')
    else:
        print(f'      ❌ HTTP {r.status_code}')

print('\n' + '=' * 70)
print('✅ TEST COMPLETE')
print('=' * 70)
print('\nNext: Open http://localhost:4200 and test in browser')
print('Login: admin/admin')
print('Test: Send "hello" and watch loading message disappear in 1-2s')
