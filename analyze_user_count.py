#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from django.contrib.auth.models import User
from api.models import GoogleAnalyticsData
from datetime import datetime, timedelta
from api.google_analytics_service import GoogleAnalyticsService
from django.conf import settings

def analyze_user_count_discrepancy():
    """Analyse pourquoi il y a une différence entre les utilisateurs actifs"""
    print("=== ANALYSE DE LA DIFFÉRENCE DES UTILISATEURS ACTIFS ===")
    print(f"Date: {datetime.now()}")
    print()
    
    # 1. Récupérer les données brutes de Google Analytics
    print("1. DONNÉES BRUTES DE GOOGLE ANALYTICS (API directe):")
    try:
        ga_service = GoogleAnalyticsService(
            credentials_json=settings.GA_CREDENTIALS,
            property_id=settings.GA_PROPERTY_ID
        )
        
        # Récupérer les données pour les 7 derniers jours
        raw_data = ga_service.get_analytics_data(days=7)
        print(f"   Sessions (API GA): {raw_data.get('sessions', 0)}")
        print(f"   Active Users (API GA): {raw_data.get('active_users', 0)}")
        print(f"   Page Views (API GA): {raw_data.get('screen_page_views', 0)}")
        print(f"   Bounce Rate (API GA): {raw_data.get('bounce_rate', 0)}")
        
    except Exception as e:
        print(f"   Erreur: {e}")
        return
    
    print()
    
    # 2. Analyser les données stockées dans la base MySQL
    print("2. DONNÉES STOCKÉES DANS LA BASE MYSQL:")
    try:
        user = User.objects.get(username='test@test.com')
        
        # Récupérer les données des 7 derniers jours
        start_date = datetime.now() - timedelta(days=7)
        stored_data = GoogleAnalyticsData.objects.filter(
            user=user,
            date__gte=start_date
        ).order_by('-date')
        
        print(f"   Nombre d'enregistrements: {stored_data.count()}")
        
        total_sessions = 0
        total_active_users = 0
        total_page_views = 0
        
        print("   Détail par jour:")
        for data in stored_data:
            print(f"     {data.date}: Sessions={data.sessions}, Users={data.active_users}, Views={data.screen_page_views}")
            total_sessions += data.sessions
            total_active_users += data.active_users
            total_page_views += data.screen_page_views
        
        print()
        print(f"   Total calculé (somme):")
        print(f"     Sessions: {total_sessions}")
        print(f"     Active Users: {total_active_users}  <-- PROBLÈME ICI")
        print(f"     Page Views: {total_page_views}")
        
    except Exception as e:
        print(f"   Erreur: {e}")
        return
    
    print()
    
    # 3. Comparer avec l'API actuelle
    print("3. COMPARAISON AVEC L'API ACTUELLE (/api/analytics/summary/):")
    try:
        import requests
        response = requests.get('http://127.0.0.1:8000/api/analytics/summary/', timeout=5)
        if response.status_code == 200:
            api_data = response.json()
            print(f"   Sessions (API Django): {api_data.get('sessions', 0)}")
            print(f"   Users (API Django): {api_data.get('users', 0)}  <-- VALEUR AFFICHÉE")
            print(f"   Page Views (API Django): {api_data.get('page_views', 0)}")
        else:
            print(f"   Erreur API: {response.status_code}")
    except Exception as e:
        print(f"   Erreur: {e}")
    
    print()
    
    # 4. Analyse du problème
    print("4. ANALYSE DU PROBLÈME:")
    print("   Google Analytics affiche les utilisateurs UNIQUES sur la période")
    print("   L'API Django fait la SOMME des utilisateurs actifs par jour")
    print("   C'est pourquoi: 11 (uniques) vs 34 (somme quotidienne)")
    print()
    
    # 5. Solution proposée
    print("5. SOLUTION PROPOSÉE:")
    print("   Modifier l'API pour:")
    print("   - Option 1: Afficher la moyenne au lieu de la somme")
    print("   - Option 2: Récupérer les données uniques directement de GA")
    print("   - Option 3: Afficher les deux valeurs avec explication")

if __name__ == "__main__":
    analyze_user_count_discrepancy()
