#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from django.contrib.auth.models import User
from api.models import GoogleAnalyticsData, GoogleAnalyticsPageData
from datetime import datetime, timedelta
import json

def analyze_database_vs_dashboard():
    """Analyse les données dans la base de données vs dashboard"""
    print("=== ANALYSE DES DONNÉES : BASE DE DONNÉES vs DASHBOARD ===")
    print(f"Date: {datetime.now()}")
    print()
    
    # 1. Récupérer les données de la base de données
    print("1. DONNÉES DANS LA BASE DE DONNÉES:")
    try:
        user = User.objects.get(username='test@test.com')
        
        # Récupérer toutes les données pour analyser
        all_data = GoogleAnalyticsData.objects.filter(user=user).order_by('-date')
        
        print(f"   Nombre total d'enregistrements: {all_data.count()}")
        print()
        
        if all_data.exists():
            print("   Détail par enregistrement:")
            for i, data in enumerate(all_data[:10], 1):  # Afficher les 10 plus récents
                print(f"     {i}. Date: {data.date}")
                print(f"        Sessions: {data.sessions}")
                print(f"        Active Users: {data.active_users}")
                print(f"        Page Views: {data.screen_page_views}")
                print(f"        Bounce Rate: {data.bounce_rate}")
                print(f"        Created: {data.created_at}")
                print(f"        Updated: {data.updated_at}")
                print()
        
        # Calculer les totaux par période
        periods = [1, 7, 30]
        for days in periods:
            start_date = datetime.now() - timedelta(days=days)
            period_data = GoogleAnalyticsData.objects.filter(
                user=user,
                date__gte=start_date
            ).order_by('-date')
            
            if period_data.exists():
                total_sessions = sum(data.sessions for data in period_data)
                total_users = sum(data.active_users for data in period_data)
                total_page_views = sum(data.screen_page_views for data in period_data)
                
                # Prendre la valeur la plus récente pour les utilisateurs (comme dans l'API)
                latest_users = period_data.first().active_users if period_data.first() else 0
                
                print(f"   Période {days} jours ({period_data.count()} enregistrements):")
                print(f"     Sessions (somme): {total_sessions}")
                print(f"     Users (somme): {total_users}")
                print(f"     Users (latest): {latest_users}  <-- Valeur API")
                print(f"     Page Views (somme): {total_page_views}")
                print()
        
    except Exception as e:
        print(f"   Erreur: {e}")
        return
    
    # 2. Comparer avec l'API actuelle
    print("2. DONNÉES RETOURNÉES PAR L'API:")
    try:
        import requests
        
        periods = [1, 7, 30]
        for days in periods:
            response = requests.get(f'http://127.0.0.1:8000/api/analytics/summary/?days={days}', timeout=5)
            if response.status_code == 200:
                api_data = response.json()
                print(f"   Période {days} jours:")
                print(f"     Sessions: {api_data.get('sessions', 0)}")
                print(f"     Users: {api_data.get('users', 0)}")
                print(f"     Page Views: {api_data.get('page_views', 0)}")
                print(f"     Bounce Rate: {api_data.get('bounce_rate', 0)}")
                print()
            else:
                print(f"   Erreur API {days} jours: {response.status_code}")
        
    except Exception as e:
        print(f"   Erreur API: {e}")
    
    # 3. Analyse des pages
    print("3. DONNÉES DES PAGES DANS LA BASE:")
    try:
        pages_data = GoogleAnalyticsPageData.objects.filter(user=user).order_by('-date')[:10]
        
        print(f"   Nombre de pages: {pages_data.count()}")
        for i, page in enumerate(pages_data[:5], 1):
            print(f"     {i}. {page.page_path}: {page.screen_page_views} vues, {page.sessions} sessions")
        print()
        
    except Exception as e:
        print(f"   Erreur pages: {e}")
    
    # 4. Vérifier la synchronisation
    print("4. VÉRIFICATION DE LA SYNCHRONISATION:")
    try:
        from api.google_analytics_service import GoogleAnalyticsService
        from django.conf import settings
        
        ga_service = GoogleAnalyticsService(
            credentials_json=settings.GA_CREDENTIALS,
            property_id=settings.GA_PROPERTY_ID
        )
        
        raw_data = ga_service.get_analytics_data(days=7)
        print("   Données brutes Google Analytics (API directe):")
        print(f"     Sessions: {raw_data.get('sessions', 0)}")
        print(f"     Active Users: {raw_data.get('active_users', 0)}")
        print(f"     Page Views: {raw_data.get('screen_page_views', 0)}")
        print(f"     Bounce Rate: {raw_data.get('bounce_rate', 0)}")
        
    except Exception as e:
        print(f"   Erreur synchronisation: {e}")

if __name__ == "__main__":
    analyze_database_vs_dashboard()
