import os
import django
import json
from urllib.request import urlopen
from urllib.parse import urlencode

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import GoogleIntegrationConfig, GoogleAnalyticsData, GoogleSearchConsoleData

print("=" * 60)
print("USERS IN DATABASE")
print("=" * 60)
for u in User.objects.all():
    print(f"User ID {u.id}: {u.username} ({u.email})")
    try:
        cfg = GoogleIntegrationConfig.objects.get(user=u)
        print(f"  ✓ Has Google Config")
        print(f"    - GA Property ID: {cfg.ga_property_id}")
        print(f"    - GSC Site URL: {cfg.gsc_site_url}")
    except:
        print(f"  ✗ No Google Config")
    
    ga_count = GoogleAnalyticsData.objects.filter(user=u).count()
    gsc_count = GoogleSearchConsoleData.objects.filter(user=u).count()
    print(f"  - GA records: {ga_count}")
    print(f"  - GSC records: {gsc_count}")
    
    if ga_count > 0:
        latest_ga = GoogleAnalyticsData.objects.filter(user=u).first()
        print(f"    Latest GA: {latest_ga.date} - sessions={latest_ga.sessions}, users={latest_ga.active_users}")
    
    if gsc_count > 0:
        top_query = GoogleSearchConsoleData.objects.filter(user=u).first()
        print(f"    Top GSC: {top_query.date} - query='{top_query.query}', clicks={top_query.clicks}, impressions={top_query.impressions}")

print("\n" + "=" * 60)
print("TESTING ENDPOINTS (HTTP)")
print("=" * 60)

base = "http://127.0.0.1:8000/api"
endpoints = [
    ("analytics/summary/?days=30&mode=period&user_id=1", "Analytics Summary 30 days"),
    ("search/summary/?days=30&mode=period&user_id=1", "Search Summary 30 days"),
    ("analytics/summary/?days=0&mode=today&user_id=1", "Analytics Today"),
    ("search/summary/?days=0&mode=today&user_id=1", "Search Today"),
]

for endpoint, label in endpoints:
    url = f"{base}/{endpoint}"
    try:
        print(f"\n{label}")
        print(f"URL: {url}")
        with urlopen(url, timeout=5) as response:
            data = json.loads(response.read())
            print(f"Status: {response.status}")
            print(f"Response: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"ERROR: {e}")
