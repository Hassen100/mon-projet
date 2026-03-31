#!/usr/bin/env python
"""
Script de test pour l'API d'authentification
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8001/api/auth"

def test_registration():
    """Test l'inscription d'un nouvel utilisateur"""
    print("🔵 Test d'inscription...")
    
    user_data = {
        "email": "test2@example.com",
        "username": "testuser2",
        "first_name": "Test",
        "last_name": "User",
        "password": "TestPassword123!",
        "password_confirm": "TestPassword123!"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register/", json=user_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ Inscription réussie!")
            return response.json()
        else:
            print("❌ Erreur lors de l'inscription")
            return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def test_login(email="test@example.com", password="TestPassword123!"):
    """Test la connexion"""
    print("\n🔵 Test de connexion...")
    
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login/", json=login_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Connexion réussie!")
            return response.json()
        else:
            print("❌ Erreur lors de la connexion")
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
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Accès au profil réussi!")
            return response.json()
        else:
            print("❌ Erreur lors de l'accès au profil")
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
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Mise à jour du profil réussie!")
            return response.json()
        else:
            print("❌ Erreur lors de la mise à jour du profil")
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
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Déconnexion réussie!")
            return True
        else:
            print("❌ Erreur lors de la déconnexion")
            return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def main():
    """Fonction principale de test"""
    print("🚀 Début des tests de l'API d'authentification")
    print("=" * 50)
    
    # Test d'inscription
    registration_result = test_registration()
    
    if registration_result:
        access_token = registration_result.get('access')
        refresh_token = registration_result.get('refresh')
        
        # Test de connexion
        login_result = test_login()
        
        if login_result:
            access_token = login_result.get('access')
            refresh_token = login_result.get('refresh')
            
            # Test d'accès au profil
            test_profile(access_token)
            
            # Test de mise à jour du profil
            test_update_profile(access_token)
            
            # Test de déconnexion
            test_logout(refresh_token)
    
    print("\n" + "=" * 50)
    print("🏁 Fin des tests")

if __name__ == "__main__":
    main()
