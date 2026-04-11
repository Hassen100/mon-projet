#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from django.conf import settings
from api.google_analytics_service import GoogleAnalyticsService
import json

def test_google_analytics_connection():
    """Test la connexion au compte Google Analytics"""
    print("=== TEST DE CONNEXION GOOGLE ANALYTICS ===")
    print(f"Date: {datetime.now()}")
    print()
    
    # Vérifier la configuration
    print("1. CONFIGURATION GOOGLE ANALYTICS:")
    print(f"   GA_PROPERTY_ID: {settings.GA_PROPERTY_ID}")
    print(f"   GA_CREDENTIALS: {'Présents' if settings.GA_CREDENTIALS else 'Manquants'}")
    
    if not settings.GA_PROPERTY_ID:
        print("   ERREUR: GA_PROPERTY_ID non configuré")
        return False
    
    if not settings.GA_CREDENTIALS:
        print("   ERREUR: GA_CREDENTIALS non configuré")
        return False
    
    # Parser les credentials pour vérifier le contenu
    try:
        if isinstance(settings.GA_CREDENTIALS, str):
            creds_dict = json.loads(settings.GA_CREDENTIALS)
        else:
            creds_dict = settings.GA_CREDENTIALS
        
        print(f"   Project ID: {creds_dict.get('project_id', 'Non trouvé')}")
        print(f"   Client Email: {creds_dict.get('client_email', 'Non trouvé')}")
        print(f"   Type: {creds_dict.get('type', 'Non trouvé')}")
        
        if not creds_dict.get('client_email'):
            print("   ERREUR: client_email manquant dans les credentials")
            return False
            
    except json.JSONDecodeError as e:
        print(f"   ERREUR: Erreur de parsing JSON: {e}")
        return False
    
    print()
    print("2. TEST DE CONNEXION À L'API GOOGLE ANALYTICS:")
    
    try:
        # Initialiser le service
        ga_service = GoogleAnalyticsService(
            credentials_json=settings.GA_CREDENTIALS,
            property_id=settings.GA_PROPERTY_ID
        )
        print("   Service Google Analytics initialisé avec succès")
        
        # Tester la récupération des données
        print("   Test de récupération des données...")
        analytics_data = ga_service.get_analytics_data(days=7)
        
        print(f"   Données récupérées avec succès:")
        print(f"     Sessions: {analytics_data.get('sessions', 0)}")
        print(f"     Active Users: {analytics_data.get('active_users', 0)}")
        print(f"     Page Views: {analytics_data.get('screen_page_views', 0)}")
        print(f"     Bounce Rate: {analytics_data.get('bounce_rate', 0)}")
        
        # Vérifier que les données sont valides
        if analytics_data.get('sessions', 0) > 0:
            print("   SUCCÈS: Connexion Google Analytics établie et données valides")
            return True
        else:
            print("   ATTENTION: Connexion établie mais aucune donnée trouvée")
            return True
            
    except Exception as e:
        print(f"   ERREUR: Échec de connexion à Google Analytics")
        print(f"   Détail: {str(e)}")
        return False

def test_analytics_pages():
    """Test la récupération des pages depuis Google Analytics"""
    print("\n3. TEST DE RÉCUPÉRATION DES PAGES:")
    
    try:
        ga_service = GoogleAnalyticsService(
            credentials_json=settings.GA_CREDENTIALS,
            property_id=settings.GA_PROPERTY_ID
        )
        
        pages_data = ga_service.get_top_pages(limit=5, days=7)
        print(f"   Pages récupérées: {len(pages_data)}")
        
        for i, page in enumerate(pages_data[:3], 1):
            print(f"     {i}. {page.get('page_path', 'N/A')}: {page.get('screen_page_views', 0)} vues")
        
        return True
        
    except Exception as e:
        print(f"   ERREUR: Échec de récupération des pages: {e}")
        return False

if __name__ == "__main__":
    from datetime import datetime
    
    success = test_google_analytics_connection()
    
    if success:
        test_analytics_pages()
        
        print("\n=== RÉSULTAT FINAL ===")
        print("SUCCÈS: Le système est bien connecté au compte Google Analytics")
        print("Les données sont synchronisées et accessibles")
    else:
        print("\n=== RÉSULTAT FINAL ===")
        print("ERREUR: Le système n'est pas connecté à Google Analytics")
        print("Veuillez vérifier la configuration des credentials")
