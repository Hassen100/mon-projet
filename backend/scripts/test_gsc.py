from api.models import GoogleIntegrationConfig
from api.google_search_console_service import GoogleSearchConsoleService
import traceback, json

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
