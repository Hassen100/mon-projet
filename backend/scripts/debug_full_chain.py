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

# Ensure config is correct
config = GoogleIntegrationConfig.objects.select_related('user').first()
if config:
    # Force gsc_site_url to correct value
    if config.gsc_site_url != 'https://seo-ia123.vercel.app/':
        config.gsc_site_url = 'https://seo-ia123.vercel.app/'
        config.save()
        print('Updated gsc_site_url in DB')
    
    print('Site URL:', config.gsc_site_url)
    creds = config.gsc_credentials_json
    
    # Create fresh service instance
    svc = GoogleSearchConsoleService(creds, config.gsc_site_url)
    
    # Debug: fetch rows manually
    start_date = datetime.now().date() - timedelta(days=30)
    end_date = datetime.now().date()
    body = {
        'startDate': start_date.isoformat(),
        'endDate': end_date.isoformat(),
        'metrics': ['clicks', 'impressions', 'ctr', 'position'],
    }
    print('\nFetching rows with body:', body)
    rows = svc._fetch_rows(body)
    print('Rows returned:', rows)
    
    # Aggregate them
    result = svc._aggregate_metrics(rows)
    print('Aggregated result:', result)
    
    # Now call get_search_data
    print('\nCalling get_search_data()...')
    final = svc.get_search_data(days=30)
    print('Final result:', final)
