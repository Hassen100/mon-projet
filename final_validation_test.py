#!/usr/bin/env python
"""FINAL VALIDATION - Loading message fix complete check"""
import requests
import time
import sys

base = 'http://127.0.0.1:8000'
frontend = 'http://localhost:4200'

print('='*70)
print('FINAL COMPREHENSIVE TEST - Loading Message Fix Validation')
print('='*70)

# 1. Verify backend is running
print('\n1. Backend Health Check')
try:
    r = requests.get(base + '/api/', timeout=3)
    if r.status_code == 200:
        print('   ✅ Backend: Online')
    else:
        print(f'   ❌ Backend: HTTP {r.status_code}')
        sys.exit(1)
except Exception as e:
    print(f'   ❌ Backend: Offline - {str(e)[:50]}')
    sys.exit(1)

# 2. Verify frontend is running
print('\n2. Frontend Health Check')
try:
    r = requests.get(frontend, timeout=3)
    if r.status_code == 200:
        print('   ✅ Frontend: Online')
    else:
        print(f'   ⚠️  Frontend: HTTP {r.status_code}')
except Exception as e:
    print(f'   ⚠️  Frontend: {str(e)[:60]}')

# 3. Login
print('\n3. Authentication')
r = requests.post(base + '/api/login/', json={'username': 'admin', 'password': 'admin'}, timeout=5)
if r.status_code != 200:
    print(f'   ❌ Login failed: HTTP {r.status_code}')
    sys.exit(1)
token = r.json().get('token', '')
headers = {'Authorization': f'Token {token}'}
print(f'   ✅ Login: Success')

# 4. Test AI with different messages
print('\n4. AI Chat - Loading Message Test')
test_messages = [
    'hello',
    'Analyse mon SEO',
    'test',
    'bonjour',
    'comment ca va?'
]

all_pass = True
for msg in test_messages:
    try:
        start = time.time()
        r = requests.post(base + '/api/ai/chat/',
            json={'message': msg, 'days': 7},
            headers=headers, timeout=20)
        elapsed = time.time() - start
        
        if r.status_code == 200:
            response = r.json().get('response', '')
            
            # Check for loading message in response
            has_loading = 'Analyse en cours' in response
            
            if has_loading:
                print(f'   ❌ "{msg}" - FAILED: Loading message in response')
                print(f'      Response: {response[:100]}')
                all_pass = False
            else:
                print(f'   ✅ "{msg}" - OK ({elapsed:.2f}s)')
        else:
            print(f'   ❌ "{msg}" - HTTP {r.status_code}')
            all_pass = False
    except Exception as e:
        print(f'   ❌ "{msg}" - Error: {str(e)[:50]}')
        all_pass = False

# 5. Final verdict
print('\n' + '='*70)
if all_pass:
    print('✅ ALL TESTS PASSED - Loading message issue is FIXED!')
    print('='*70)
    print('\n✨ Your AI Assistant is now fully operational!')
else:
    print('⚠️  Some tests failed - See details above')
    print('='*70)
