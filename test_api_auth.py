#!/usr/bin/env python
import os
import sys
import requests
import json

# Ajouter le chemin du backend
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User

# Obtenir le token pour l'utilisateur hassen
try:
    user = User.objects.get(username='hassen')
    token = Token.objects.get(user=user)
    print(f"Token: {token.key}")
    
    # Tester l'API analytics summary
    headers = {'Authorization': f'Token {token.key}'}
    
    # Test analytics summary
    response = requests.get('http://127.0.0.1:8000/api/analytics/summary/?days=30', headers=headers)
    print(f"\nAnalytics Summary Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    # Test top pages
    response = requests.get('http://127.0.0.1:8000/api/analytics/top-pages/?days=30', headers=headers)
    print(f"\nTop Pages Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    # Test top queries
    response = requests.get('http://127.0.0.1:8000/api/search/top-queries/?days=30', headers=headers)
    print(f"\nTop Queries Status: {response.status_code}")
    print(f"Response: {response.text}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
