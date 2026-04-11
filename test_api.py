import requests
import json

# Test de login pour obtenir le token
login_data = {
    "username": "hassen",
    "password": "hassen123"
}

try:
    response = requests.post("http://127.0.0.1:8000/api/login/", json=login_data)
    print("Login response:", response.status_code)
    print("Response:", response.json())
    
    if response.status_code == 200:
        token = response.json().get('token', '')
        print("Token obtenu:", token)
        
        # Test de l'analyse d'URL
        headers = {
            "Authorization": f"Token {token}",
            "Content-Type": "application/json"
        }
        
        analysis_data = {
            "url": "https://google.com",
            "period": 30
        }
        
        analysis_response = requests.post(
            "http://127.0.0.1:8000/api/analyze-url/",
            json=analysis_data,
            headers=headers
        )
        
        print("\nAnalyse response:", analysis_response.status_code)
        print("Response:", analysis_response.json())
        
    else:
        print("Erreur de login")
        
except Exception as e:
    print(f"Erreur: {e}")
