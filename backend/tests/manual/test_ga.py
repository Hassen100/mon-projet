#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.google_analytics_service import GoogleAnalyticsService
from api.models import GoogleIntegrationConfig
from django.contrib.auth.models import User

print('=== CONFIGURATION CHECK ===')
user = User.objects.get(id=1)
config = GoogleIntegrationConfig.objects.get(user=user)

print(f'GA Property ID: {config.ga_property_id}')
print(f'Has credentials: {bool(config.ga_credentials_json)}')
print(f'Credentials keys: {list(config.ga_credentials_json.keys()) if config.ga_credentials_json else []}')

service = GoogleAnalyticsService(config.ga_credentials_json, config.ga_property_id)

print('\n=== TESTING REAL-TIME API ===')
try:
    # Test avec 1 jour pour voir les données les plus récentes
    realtime_data = service.get_analytics_data(1)
    print(f'Last 1 day data: {realtime_data}')
    
    # Test avec 7 jours
    week_data = service.get_analytics_data(7)
    print(f'Last 7 days data: {week_data}')
    
    # Test avec 30 jours
    month_data = service.get_analytics_data(30)
    print(f'Last 30 days data: {month_data}')
    
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()

print('\n=== TESTING TOP PAGES ===')
try:
    top_pages = service.get_top_pages(limit=5, days=7)
    print(f'Top pages (7 days): {top_pages}')
except Exception as e:
    print(f'Error getting top pages: {e}')
