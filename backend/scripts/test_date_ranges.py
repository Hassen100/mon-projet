import os
import sys
import django
from datetime import datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(HERE)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import GoogleIntegrationConfig
from api.google_search_console_service import GoogleSearchConsoleService

config = GoogleIntegrationConfig.objects.select_related('user').first()
if config:
    creds = config.gsc_credentials_json
    svc = GoogleSearchConsoleService(creds, config.gsc_site_url)
    
    # Check what _get_date_range returns for 30 days
    start_30, end_30 = svc._get_date_range(30, 'period')
    print(f'_get_date_range(30, period): {start_30} to {end_30}')
    
    # Now test with BOTH date ranges
    print(f'\n=== Testing 30-day manual range (2026-04-05 to 2026-05-05) ===')
    rows_30manual = svc._fetch_rows({
        'startDate': '2026-04-05',
        'endDate': '2026-05-05',
        'metrics': ['clicks', 'impressions', 'ctr', 'position'],
    })
    print(f'Rows: {rows_30manual}')
    
    print(f'\n=== Testing 28-day calculated range ({start_30} to {end_30}) ===')
    rows_28calc = svc._fetch_rows({
        'startDate': start_30.isoformat(),
        'endDate': end_30.isoformat(),
        'metrics': ['clicks', 'impressions', 'ctr', 'position'],
    })
    print(f'Rows: {rows_28calc}')
