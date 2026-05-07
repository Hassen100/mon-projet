import os
import sys
import django

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(HERE)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import GoogleIntegrationConfig
from api.google_search_console_service import GoogleSearchConsoleService
from datetime import datetime, timedelta

config = GoogleIntegrationConfig.objects.select_related('user').first()
if config:
    creds = config.gsc_credentials_json
    svc = GoogleSearchConsoleService(creds, config.gsc_site_url)
    
    # Manually test _aggregate_metrics with the row we saw
    rows = [{'clicks': 4, 'impressions': 5, 'ctr': 0.8, 'position': 1}]
    result = svc._aggregate_metrics(rows)
    print('_aggregate_metrics result:', result)
    
    # Now test what get_search_data actually returns
    print('\nget_search_data result:', svc.get_search_data(days=30))
