#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.google_search_console_service import GoogleSearchConsoleService
from api.models import GoogleIntegrationConfig
from django.contrib.auth.models import User

print('=== GOOGLE SEARCH CONSOLE TEST ===')
user = User.objects.get(id=1)
config = GoogleIntegrationConfig.objects.get(user=user)

print(f'GSC Site URL: {config.gsc_site_url}')
print(f'Has credentials: {bool(config.gsc_credentials_json)}')

service = GoogleSearchConsoleService(config.gsc_credentials_json, config.gsc_site_url)

print('\n=== TESTING GSC API ===')
try:
    # Test avec 1 jour
    day_data = service.get_search_data(1)
    print(f'Last 1 day data: {day_data}')
    
    # Test avec 7 jours
    week_data = service.get_search_data(7)
    print(f'Last 7 days data: {week_data}')
    
    # Test avec 30 jours
    month_data = service.get_search_data(30)
    print(f'Last 30 days data: {month_data}')
    
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()

print('\n=== TESTING SAVE SEARCH DATA ===')
try:
    saved_data = service.save_search_data(user, 30)
    print(f'Saved search data: {saved_data}')
except Exception as e:
    print(f'Error saving search data: {e}')
    import traceback
    traceback.print_exc()

print('\n=== TESTING TOP QUERIES ===')
try:
    top_queries = service.get_top_queries(limit=5, days=30)
    print(f'Top queries: {top_queries}')
except Exception as e:
    print(f'Error getting top queries: {e}')
