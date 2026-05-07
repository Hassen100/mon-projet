import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import GoogleIntegrationConfig, GoogleAnalyticsData, GoogleSearchConsoleData

print('Users', User.objects.count())
for u in User.objects.all():
    print('User', u.id, u.username, u.email)
    try:
        cfg = GoogleIntegrationConfig.objects.get(user=u)
        print('  has config GA', bool(cfg.ga_property_id), 'GSC', bool(cfg.gsc_site_url))
    except Exception as e:
        print('  no config', e)
    print('  GA data count', GoogleAnalyticsData.objects.filter(user=u).count())
    print('  GSC data count', GoogleSearchConsoleData.objects.filter(user=u).count())
