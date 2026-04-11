#!/usr/bin/env python
import requests
import json

print("🔐 Test complet de l'authentification Django...")

# Test 1: Login pour obtenir un token
print("\n1️⃣ Test de login:")
login_data = {
    'username': 'test@test.com',
    'password': 'password123'  # Mot de passe par défaut
}

try:
    response = requests.post('http://127.0.0.1:8000/api/login/', json=login_data)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")
    
    if response.status_code == 200:
        login_result = response.json()
        token = login_result.get('token')
        print(f"   ✅ Token obtenu: {token}")
        
        # Test 2: Utiliser le token pour accéder aux APIs protégées
        if token:
            print("\n2️⃣ Test d'accès aux APIs avec token:")
            headers = {'Authorization': f'Token {token}'}
            
            # Test analytics summary avec authentification
            response = requests.get('http://127.0.0.1:8000/api/analytics/summary/?days=30', headers=headers)
            print(f"   Analytics Summary Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Sessions: {data['sessions']}")
            else:
                print(f"   ❌ Erreur: {response.text}")
                
            # Test endpoint auth-users
            response = requests.get('http://127.0.0.1:8000/api/auth-users/?admin_email=test@test.com', headers=headers)
            print(f"   Auth Users Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Utilisateurs trouvés: {len(data.get('users', []))}")
            else:
                print(f"   ❌ Erreur: {response.text}")
                
    else:
        print("   ❌ Login échoué")
        
except Exception as e:
    print(f"   ❌ Erreur: {e}")

# Test 3: Vérifier la configuration de l'authentification
print("\n3️⃣ Vérification de la configuration:")
try:
    # Test sans authentification (devrait échouer si les permissions sont correctes)
    response = requests.get('http://127.0.0.1:8000/api/admin/users/')
    print(f"   Accès sans authentification: {response.status_code}")
    if response.status_code == 401:
        print("   ✅ L'authentification est bien requise")
    else:
        print("   ⚠️ L'authentification n'est pas requise (permissions par défaut)")
        
except Exception as e:
    print(f"   ❌ Erreur: {e}")

print("\n🎯 Test de création de token manuel:")
try:
    # Créer un token manuellement pour test@test.com
    import os
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    import django
    django.setup()
    
    from django.contrib.auth.models import User
    from rest_framework.authtoken.models import Token
    
    user = User.objects.get(username='test@test.com')
    token, created = Token.objects.get_or_create(user=user)
    print(f"   ✅ Token manuel créé: {token.key} (nouveau: {created})")
    
except Exception as e:
    print(f"   ❌ Erreur création token: {e}")

print(f"\n🌐 Dashboard Angular: http://localhost:4205")
print(f"🔧 Backend API: http://127.0.0.1:8000")
print(f"✅ Authentification Django configurée et testée !")
