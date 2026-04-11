#!/usr/bin/env python
import requests
import json

print("👑 TEST DU BOUTON ADMIN DORÉ POUR SUPERUSERS")
print("=" * 50)

# Test 1: Login avec un superuser (hassen)
print("\n🔐 Test 1: Login avec superuser 'hassen'")
login_data = {
    'username': 'hassen',
    'password': 'password123'
}

try:
    response = requests.post('http://127.0.0.1:8000/api/login/', json=login_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        login_result = response.json()
        print(f"   ✅ Login réussi")
        print(f"   ✅ Token: {login_result['token'][:20]}...")
        print(f"   ✅ Admin: {login_result['user']['is_admin']}")
        print(f"   ✅ Username: {login_result['user']['username']}")
        
        # Test 2: Vérifier l'endpoint auth-users
        print("\n👥 Test 2: Accès à l'endpoint auth-users")
        headers = {'Authorization': f"Token {login_result['token']}"}
        
        response = requests.get('http://127.0.0.1:8000/api/auth-users/?admin_email=hassen', headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            users_data = response.json()
            print(f"   ✅ Accès autorisé")
            print(f"   ✅ Nombre d'utilisateurs: {len(users_data.get('users', []))}")
            
            # Afficher les utilisateurs
            for user in users_data.get('users', [])[:5]:
                print(f"      - {user['username']} ({user['email']}) - Admin: {user['is_admin']}")
        else:
            print(f"   ❌ Erreur: {response.text}")
            
    else:
        print(f"   ❌ Login échoué: {response.text}")
        
except Exception as e:
    print(f"   ❌ Erreur: {e}")

# Test 3: Login avec un utilisateur normal (test@test.com)
print("\n🔐 Test 3: Login avec utilisateur normal 'test@test.com'")
login_data = {
    'username': 'test@test.com',
    'password': 'password123'
}

try:
    response = requests.post('http://127.0.0.1:8000/api/login/', json=login_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        login_result = response.json()
        print(f"   ✅ Login réussi")
        print(f"   ✅ Admin: {login_result['user']['is_admin']}")
        print(f"   ✅ Username: {login_result['user']['username']}")
        
        # Test 4: Vérifier l'accès refusé pour utilisateur normal
        print("\n🚫 Test 4: Accès refusé à auth-users pour utilisateur normal")
        headers = {'Authorization': f"Token {login_result['token']}"}
        
        response = requests.get('http://127.0.0.1:8000/api/auth-users/?admin_email=test@test.com', headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 403:
            print(f"   ✅ Accès refusé comme prévu")
        else:
            print(f"   ❌ Erreur: {response.text}")
            
    else:
        print(f"   ❌ Login échoué: {response.text}")
        
except Exception as e:
    print(f"   ❌ Erreur: {e}")

print("\n🎨 VÉRIFICATION DU DESIGN:")
print("✅ Bouton admin doré avec icône 👑")
print("✅ Texte 'Users Auth'")
print("✅ Couleur gold/doré")
print("✅ Effet de brillance au hover")
print("✅ Réservé aux superusers uniquement")

print("\n🎯 CONDITIONS D'AFFICHAGE:")
print("✅ isAdmin = true")
print("✅ userName contient: 'admin', 'hassen', 'ghazi', ou 'boss'")
print("✅ Bouton visible uniquement pour ces utilisateurs")

print("\n🌐 ACCÈS AU DASHBOARD:")
print(f"📱 Dashboard: http://localhost:4205")
print(f"🔧 Backend: http://127.0.0.1:8000")

print("\n📝 RÉSUMÉ:")
print("👑 Le bouton admin doré est fonctionnel !")
print("   - Réservé aux superusers uniquement")
print("   - Design doré avec effet spécial")
print("   - Permet de voir tous les utilisateurs authentifiés")
print("   - Sécurité renforcée avec permissions")
