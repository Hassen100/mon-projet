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

# Update to sc-domain:
config = GoogleIntegrationConfig.objects.select_related('user').first()
if config:
    print('=== BEFORE UPDATE ===')
    print('gsc_site_url:', config.gsc_site_url)
    
    config.gsc_site_url = 'sc-domain:seo-ia123.vercel.app'
    config.save()
    
    print('\n=== AFTER UPDATE ===')
    print('gsc_site_url:', config.gsc_site_url)
    
    print('\n=== TESTING WITH sc-domain: ===')
    creds = config.gsc_credentials_json
    try:
        svc = GoogleSearchConsoleService(creds, config.gsc_site_url)
        d = svc.get_search_data(days=30)
        print('search_data:', d)
        print('top_queries:', svc.get_top_queries(limit=5, days=30))
        print('top_pages:', svc.get_top_pages(limit=5, days=30))
    except Exception:
        traceback.print_exc()
