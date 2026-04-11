#!/usr/bin/env python
import os
import sys

# Ajouter le chemin du backend
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

print("📋 Utilisateurs dans la base:")
for user in User.objects.all():
    print(f"  - {user.username} (email: {user.email})")

print("\n🔑 Création de l'utilisateur hassen...")
try:
    user = User.objects.get(username='hassen')
    print("L'utilisateur hassen existe déjà")
except User.DoesNotExist:
    print("Création de l'utilisateur hassen...")
    user = User.objects.create_user(
        username='hassen',
        email='hassen@example.com',
        password='password123',
        is_staff=True,
        is_superuser=True
    )
    print("Utilisateur hassen créé")

# Créer ou récupérer le token
token, created = Token.objects.get_or_create(user=user)
print(f"Token pour hassen: {token.key} (créé: {created})")

# Tester l'API
import requests
headers = {'Authorization': f'Token {token.key}'}

print("\n🧪 Test des API endpoints:")

# Test analytics summary
try:
    response = requests.get('http://127.0.0.1:8000/api/analytics/summary/?days=30', headers=headers)
    print(f"Analytics Summary Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Erreur Analytics Summary: {e}")

# Test top pages
try:
    response = requests.get('http://127.0.0.1:8000/api/analytics/top-pages/?days=30', headers=headers)
    print(f"\nTop Pages Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Erreur Top Pages: {e}")

# Test top queries
try:
    response = requests.get('http://127.0.0.1:8000/api/search/top-queries/?days=30', headers=headers)
    print(f"\nTop Queries Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Erreur Top Queries: {e}")
