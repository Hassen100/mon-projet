#!/usr/bin/env python
import requests
import json

# Test login pour obtenir un token
login_data = {
    'username': 'hassen',
    'password': 'password123'
}

print("🔐 Test login pour obtenir le token...")
try:
    response = requests.post('http://127.0.0.1:8000/api/login/', json=login_data)
    print(f"Login Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        login_result = response.json()
        token = login_result.get('token')
        if token:
            print(f"Token obtenu: {token}")
            
            # Tester les API avec le token
            headers = {'Authorization': f'Token {token}'}
            
            print("\n📊 Test Analytics Summary...")
            response = requests.get('http://127.0.0.1:8000/api/analytics/summary/?days=30', headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            print("\n📄 Test Top Pages...")
            response = requests.get('http://127.0.0.1:8000/api/analytics/top-pages/?days=30', headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            print("\n🔍 Test Top Queries...")
            response = requests.get('http://127.0.0.1:8000/api/search/top-queries/?days=30', headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
        else:
            print("Pas de token dans la réponse")
    else:
        print("Login échoué")
        
except Exception as e:
    print(f"Erreur: {e}")
    import traceback
    traceback.print_exc()
