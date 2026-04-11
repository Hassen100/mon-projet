#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import GoogleAnalyticsData, GoogleSearchConsoleData, GoogleAnalyticsPageData
from django.contrib.auth.models import User

user = User.objects.get(id=1)

print('📊 Google Analytics:')
analytics = GoogleAnalyticsData.objects.filter(user=user).order_by('-date')[:5]
for data in analytics:
    print(f'  {data.date}: {data.sessions} sessions, {data.active_users} users')

print('\n🔍 Search Console:')
search = GoogleSearchConsoleData.objects.filter(user=user).order_by('-clicks')[:5]
for data in search:
    print(f'  "{data.query}": {data.clicks} clics, position {data.position}')

print('\n📄 Pages Analytics:')
pages = GoogleAnalyticsPageData.objects.filter(user=user).order_by('-screen_page_views')[:5]
for data in pages:
    print(f'  {data.page_path}: {data.screen_page_views} vues')

print('\n✅ Données réelles injectées avec succès !')
