#!/usr/bin/env python
import os
import sys

# Ajouter le chemin du backend
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from django.contrib.auth.models import User
from api.models import GoogleAnalyticsData, GoogleAnalyticsPageData, GoogleSearchConsoleData

print("🔍 Vérification des données par utilisateur:")

for user in User.objects.all():
    print(f"\n👤 Utilisateur: {user.username} (ID: {user.id})")
    
    # Vérifier GoogleAnalyticsData
    analytics_count = GoogleAnalyticsData.objects.filter(user=user).count()
    print(f"  📊 GoogleAnalyticsData: {analytics_count} enregistrements")
    if analytics_count > 0:
        latest = GoogleAnalyticsData.objects.filter(user=user).order_by('-date').first()
        print(f"    Dernier: {latest.date} - {latest.sessions} sessions")
    
    # Vérifier GoogleAnalyticsPageData
    pages_count = GoogleAnalyticsPageData.objects.filter(user=user).count()
    print(f"  📄 GoogleAnalyticsPageData: {pages_count} enregistrements")
    if pages_count > 0:
        latest = GoogleAnalyticsPageData.objects.filter(user=user).order_by('-date').first()
        print(f"    Dernier: {latest.date} - {latest.page_path} - {latest.screen_page_views} vues")
    
    # Vérifier GoogleSearchConsoleData
    search_count = GoogleSearchConsoleData.objects.filter(user=user).count()
    print(f"  🔍 GoogleSearchConsoleData: {search_count} enregistrements")
    if search_count > 0:
        latest = GoogleSearchConsoleData.objects.filter(user=user).order_by('-date').first()
        print(f"    Dernier: {latest.date} - {latest.query} - {latest.clicks} clics")

print("\n🎯 Test direct de l'endpoint avec l'utilisateur qui a des données...")
# Trouver un utilisateur avec des données
for user in User.objects.all():
    if GoogleAnalyticsData.objects.filter(user=user).exists():
        print(f"\nUtilisation de l'utilisateur: {user.username}")
        
        from datetime import datetime, timedelta
        start_date = datetime.now() - timedelta(days=30)
        
        analytics_data = GoogleAnalyticsData.objects.filter(
            user=user,
            date__gte=start_date
        ).order_by('-date')
        
        print(f"Analytics data trouvés: {analytics_data.count()}")
        for data in analytics_data[:3]:
            print(f"  {data.date}: {data.sessions} sessions, {data.active_users} users")
        break
