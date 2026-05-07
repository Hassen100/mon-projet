import os
import sys
import django
import traceback
import json

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
    
    # Test WITHOUT dimensions (what get_search_data uses)
    print('=== WITHOUT DIMENSIONS ===')
    start_date = datetime.now().date() - timedelta(days=30)
    end_date = datetime.now().date()
    
    rows_no_dim = svc._fetch_rows({
        'startDate': start_date.isoformat(),
        'endDate': end_date.isoformat(),
        'metrics': ['clicks', 'impressions', 'ctr', 'position'],
    })
    print('rows:', json.dumps(rows_no_dim, indent=2))
    
    # Test WITH dimensions (what get_top_queries uses)
    print('\n=== WITH dimensions=["query"] ===')
    rows_with_dim = svc._fetch_rows({
        'startDate': start_date.isoformat(),
        'endDate': end_date.isoformat(),
        'dimensions': ['query'],
        'metrics': ['clicks', 'impressions', 'ctr', 'position'],
        'rowLimit': 5,
        'orderBy': [{'direction': 'DESCENDING', 'sortBy': 'clicks'}],
    })
    print('rows:', json.dumps(rows_with_dim, indent=2))
