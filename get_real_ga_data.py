#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from django.contrib.auth.models import User
from api.google_analytics_service import GoogleAnalyticsService
from django.conf import settings
import json

def get_real_google_analytics_data():
    """Récupère les vraies données de Google Analytics comme dans l'interface"""
    print("=== RÉCUPÉRATION DES DONNÉES RÉELLES GOOGLE ANALYTICS ===")
    
    try:
        # Initialiser le service Google Analytics
        ga_service = GoogleAnalyticsService(
            credentials_json=settings.GA_CREDENTIALS,
            property_id=settings.GA_PROPERTY_ID
        )
        
        # Récupérer les données pour différentes périodes
        periods = [7, 30, 90]
        
        for days in periods:
            print(f"\n--- Période: {days} derniers jours ---")
            
            # Récupérer les données brutes
            raw_data = ga_service.get_analytics_data(days=days)
            
            print(f"Sessions: {raw_data.get('sessions', 0)}")
            print(f"Active Users: {raw_data.get('active_users', 0)}")
            print(f"Page Views: {raw_data.get('screen_page_views', 0)}")
            print(f"Bounce Rate: {raw_data.get('bounce_rate', 0):.2f}")
            
            # Comparer avec l'API actuelle
            import requests
            try:
                response = requests.get(f'http://127.0.0.1:8000/api/analytics/summary/?days={days}', timeout=5)
                if response.status_code == 200:
                    api_data = response.json()
                    print(f"API Django - Sessions: {api_data.get('sessions', 0)}")
                    print(f"API Django - Users: {api_data.get('users', 0)}")
                    print(f"API Django - Views: {api_data.get('page_views', 0)}")
                    
                    # Calculer la différence
                    users_diff = raw_data.get('active_users', 0) - api_data.get('users', 0)
                    if users_diff != 0:
                        print(f"DIFFÉRENCE USERS: {users_diff}")
                else:
                    print(f"Erreur API: {response.status_code}")
            except:
                print("Impossible de contacter l'API Django")
        
        print("\n=== ANALYSE DES DIFFÉRENCES POSSIBLES ===")
        print("1. Période différente dans Google Analytics interface")
        print("2. Filtres appliqués dans l'interface GA")
        print("3. Timezone différent")
        print("4. Segment de données différent")
        
        print("\n=== RECOMMANDATION ===")
        print("Pour correspondre exactement à votre Google Analytics:")
        print("- Vérifiez la période sélectionnée dans votre interface GA")
        print("- Assurez-vous qu'il n'y a pas de filtres actifs")
        print("- Vérifiez le timezone dans les paramètres GA")
        
    except Exception as e:
        print(f"Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    get_real_google_analytics_data()
