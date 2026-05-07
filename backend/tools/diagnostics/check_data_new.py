#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import GoogleAnalyticsData, GoogleSearchConsoleData, GoogleIntegrationConfig

with open('data_diagnostic.txt', 'w', encoding='utf-8') as f:
    f.write("DIAGNOSTIC DATA\n")
    f.write("=" * 60 + "\n\n")
    
    # Check users
    users = User.objects.all()
    f.write(f"Total users: {users.count()}\n")
    for u in users:
        f.write(f"\nUser #{u.id}: {u.username} ({u.email})\n")
        
        # Check config
        try:
            cfg = GoogleIntegrationConfig.objects.get(user=u)
            f.write(f"  Config: YES\n")
            f.write(f"    GA Property ID: {cfg.ga_property_id}\n")
            f.write(f"    GSC Site URL: {cfg.gsc_site_url}\n")
        except:
            f.write(f"  Config: NO\n")
        
        # Check GA data
        ga_recs = GoogleAnalyticsData.objects.filter(user=u)
        f.write(f"  GA Data Records: {ga_recs.count()}\n")
        if ga_recs.exists():
            for rec in ga_recs[:3]:
                f.write(f"    {rec.date}: sessions={rec.sessions}, users={rec.active_users}, views={rec.screen_page_views}\n")
        
        # Check GSC data
        gsc_recs = GoogleSearchConsoleData.objects.filter(user=u)
        f.write(f"  GSC Data Records: {gsc_recs.count()}\n")
        if gsc_recs.exists():
            for rec in gsc_recs[:3]:
                f.write(f"    {rec.date}: query='{rec.query}', clicks={rec.clicks}, impressions={rec.impressions}\n")

print("OK")
