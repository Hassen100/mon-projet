import os
import sys
import django
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(HERE)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import GoogleIntegrationConfig
from api.google_search_console_service import GoogleSearchConsoleService

# Revert to original URL
config = GoogleIntegrationConfig.objects.select_related('user').first()
if config:
    print('=== REVERTING TO ORIGINAL URL ===')
    config.gsc_site_url = 'https://seo-ia123.vercel.app/'
    config.save()
    print('gsc_site_url:', config.gsc_site_url)
    
    print('\n=== TESTING WITH ORIGINAL URL ===')
    creds = config.gsc_credentials_json
    try:
        svc = GoogleSearchConsoleService(creds, config.gsc_site_url)
        # Try to fetch rows directly to see actual API error
        rows = svc._fetch_rows({
            'startDate': '2026-04-05',
            'endDate': '2026-05-05',
            'metrics': ['clicks', 'impressions', 'ctr', 'position'],
        })
        print('rows:', rows)
        if not rows:
            print('(No rows returned — this is the actual API response, not an exception)')
    except Exception:
        print('Exception raised:')
        traceback.print_exc()
