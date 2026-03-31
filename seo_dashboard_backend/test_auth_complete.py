#!/usr/bin/env python
"""
Script de test complet pour l'API d'authentification
"""

import requests
import random
import string

BASE_URL = "http://127.0.0.1:8001/api/auth"

def generate_random_user():
    """Génère un utilisateur aléatoire"""
    random_num = random.randint(1000, 9999)
    return {
        "email": f"test{random_num}@example.com",
        "username": f"testuser{random_num}",
        "first_name": "Test",
        "last_name": f"User{random_num}",
        "password": "TestPassword123!",
        "password_confirm": "TestPassword123!"
    }

def test_registration():
    """Test l'inscription d'un nouvel utilisateur"""
    print("🔵 Test d'inscription...")
    
    user_data = generate_random_user()
    
    try:
        response = requests.post(f"{BASE_URL}/register/", json=user_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Inscription réussie!")
            print(f"Email: {result['user']['email']}")
            return result
        else:
            print(f"❌ Erreur lors de l'inscription: {response.json()}")
            return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def test_login(email, password):
    """Test la connexion"""
    print("\n🔵 Test de connexion...")
    
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login/", json=login_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Connexion réussie!")
            return result
        else:
            print(f"❌ Erreur lors de la connexion: {response.json()}")
            return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def test_profile(access_token):
    """Test l'accès au profil"""
    print("\n🔵 Test d'accès au profil...")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/profile/", headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Accès au profil réussi!")
            print(f"Utilisateur: {result['email']}")
            return result
        else:
            print(f"❌ Erreur lors de l'accès au profil: {response.json()}")
            return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def test_update_profile(access_token):
    """Test la mise à jour du profil"""
    print("\n🔵 Test de mise à jour du profil...")
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    update_data = {
        "first_name": "Updated",
        "last_name": "Name",
        "profile": {
            "bio": "Ceci est ma bio mise à jour",
            "phone": "+212600000000",
            "address": "Rue test, Ville test"
        }
    }
    
    try:
        response = requests.patch(f"{BASE_URL}/profile/update/", 
                                json=update_data, headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Mise à jour du profil réussie!")
            return result
        else:
            print(f"❌ Erreur lors de la mise à jour du profil: {response.json()}")
            return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def test_logout(refresh_token):
    """Test la déconnexion"""
    print("\n🔵 Test de déconnexion...")
    
    logout_data = {
        "refresh": refresh_token
    }
    
    try:
        response = requests.post(f"{BASE_URL}/logout/", json=logout_data)
        print(f"Status: {response.status_code}")
        result = response.json()
        
        if response.status_code == 200:
            print("✅ Déconnexion réussie!")
            return True
        else:
            print(f"❌ Erreur lors de la déconnexion: {result}")
            return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_protected_endpoint_after_logout(access_token):
    """Test l'accès à un endpoint protégé après déconnexion"""
    print("\n🔵 Test d'accès après déconnexion...")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/profile/", headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Accès correctement refusé après déconnexion!")
            return True
        else:
            print(f"❌ Accès toujours possible: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_invalid_credentials():
    """Test avec des identifiants invalides"""
    print("\n🔵 Test des identifiants invalides...")
    
    login_data = {
        "email": "invalid@example.com",
        "password": "wrongpassword"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login/", json=login_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Identifiants invalides correctement rejetés!")
            return True
        else:
            print(f"❌ Problème avec la validation: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_invalid_registration():
    """Test l'inscription avec des données invalides"""
    print("\n🔵 Test d'inscription invalide...")
    
    invalid_data = {
        "email": "invalid-email",
        "username": "",
        "first_name": "Test",
        "last_name": "User",
        "password": "123",
        "password_confirm": "456"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register/", json=invalid_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Données invalides correctement rejetées!")
            return True
        else:
            print(f"❌ Problème avec la validation: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def main():
    """Fonction principale de test"""
    print("🚀 Début des tests complets de l'API d'authentification")
    print("=" * 60)
    
    # Test 1: Inscription
    registration_result = test_registration()
    
    if registration_result:
        access_token = registration_result.get('access')
        refresh_token = registration_result.get('refresh')
        email = registration_result['user']['email']
        
        # Test 2: Connexion
        login_result = test_login(email, "TestPassword123!")
        
        if login_result:
            access_token = login_result.get('access')
            refresh_token = login_result.get('refresh')
            
            # Test 3: Accès au profil
            test_profile(access_token)
            
            # Test 4: Mise à jour du profil
            test_update_profile(access_token)
            
            # Test 5: Déconnexion
            logout_success = test_logout(refresh_token)
            
            if logout_success:
                # Test 6: Accès après déconnexion
                test_protected_endpoint_after_logout(access_token)
    
    # Tests additionnels
    test_invalid_credentials()
    test_invalid_registration()
    
    print("\n" + "=" * 60)
    print("🏁 Fin des tests complets")

if __name__ == "__main__":
    main()
