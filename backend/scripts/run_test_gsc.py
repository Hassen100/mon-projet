import os
import sys
import django
import traceback

# Ensure repository root is on sys.path so the 'backend' package is importable
HERE = os.path.dirname(os.path.abspath(__file__))
# The Django project package lives under the outer 'backend' folder
BACKEND_ROOT = os.path.dirname(HERE)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import GoogleIntegrationConfig
from api.google_search_console_service import GoogleSearchConsoleService

cfg = GoogleIntegrationConfig.objects.select_related('user').first()
print('cfg_exists', bool(cfg))
if not cfg:
    print('No GoogleIntegrationConfig found')
else:
    print('user', cfg.user.username)
    print('gsc_site_url', cfg.gsc_site_url)
    creds = cfg.gsc_credentials_json
    print('creds_keys', list(creds.keys()) if creds else None)
    try:
        svc = GoogleSearchConsoleService(creds, cfg.gsc_site_url)
        d = svc.get_search_data(days=30)
        print('search_data:', d)
        print('top_queries:', svc.get_top_queries(limit=5, days=30))
        print('top_pages:', svc.get_top_pages(limit=5, days=30))
    except Exception:
        traceback.print_exc()
