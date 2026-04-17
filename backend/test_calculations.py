#!/usr/bin/env python
"""
Test script to verify the calculations for Google Analytics and Search Console data
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from datetime import datetime, timedelta
from api.models import GoogleSearchConsoleData, GoogleAnalyticsData
from django.contrib.auth.models import User
from django.db.models import Sum, Avg

print("=" * 60)
print("Testing Google Search Console Data Calculations")
print("=" * 60)

try:
    user = User.objects.get(id=1)
    print(f"\n✓ User found: {user.username}")
    
    # Test 30 days data (should be 28 days now)
    start_date_30 = datetime.now().date() - timedelta(days=28)  # 28 days
    data_30days = GoogleSearchConsoleData.objects.filter(
        user=user, 
        date__gte=start_date_30
    )
    
    if data_30days.exists():
        print(f"\n📊 30-Day Period Data (28 days actual):")
        print(f"  - Records: {data_30days.count()}")
        
        # Aggregate metrics
        agg = data_30days.values('query').annotate(
            total_clicks=Sum('clicks'),
            total_impressions=Sum('impressions')
        ).order_by('-total_clicks')[:5]
        
        for item in agg:
            clicks = item['total_clicks'] or 0
            impressions = item['total_impressions'] or 0
            ctr = (clicks / impressions * 100) if impressions > 0 else 0
            print(f"  - Query: {item['query'][:40]:40s} | Clicks: {clicks:4d} | CTR: {ctr:6.2f}%")
    else:
        print("  - No data found for 30-day period")
    
    # Test today's data
    today_date = datetime.now().date()
    data_today = GoogleSearchConsoleData.objects.filter(
        user=user,
        date=today_date
    )
    
    if data_today.exists():
        print(f"\n📊 Today's Data (24h):")
        print(f"  - Records: {data_today.count()}")
        
        total_clicks = sum(d.clicks for d in data_today)
        total_impressions = sum(d.impressions for d in data_today)
        ctr_today = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        
        print(f"  - Total Clicks: {total_clicks}")
        print(f"  - Total Impressions: {total_impressions}")
        print(f"  - CTR: {ctr_today:.2f}%")
    else:
        print("  - No data found for today")

except User.DoesNotExist:
    print("❌ User not found with ID 1")

print("\n" + "=" * 60)
print("Testing Google Analytics Data Calculations")
print("=" * 60)

try:
    user = User.objects.get(id=1)
    
    # Test 30 days data (should be 28 days now)
    start_date_30 = datetime.now().date() - timedelta(days=28)  # 28 days
    data_30days = GoogleAnalyticsData.objects.filter(
        user=user,
        date__gte=start_date_30
    )
    
    if data_30days.exists():
        print(f"\n📈 30-Day Period Data (28 days actual):")
        print(f"  - Records: {data_30days.count()}")
        
        total_sessions = sum(d.sessions for d in data_30days)
        total_page_views = sum(d.screen_page_views for d in data_30days)
        latest = data_30days.first()
        total_users = latest.active_users if latest else 0
        
        bounce_rates = [d.bounce_rate for d in data_30days if d.bounce_rate]
        avg_bounce = sum(bounce_rates) / len(bounce_rates) if bounce_rates else 0
        
        print(f"  - Total Sessions: {total_sessions}")
        print(f"  - Total Page Views: {total_page_views}")
        print(f"  - Active Users: {total_users}")
        print(f"  - Avg Bounce Rate: {avg_bounce:.2f}%")
    else:
        print("  - No data found for 30-day period")
    
    # Test today's data
    today_date = datetime.now().date()
    data_today = GoogleAnalyticsData.objects.filter(
        user=user,
        date=today_date
    )
    
    if data_today.exists():
        print(f"\n📈 Today's Data (24h):")
        today_data = data_today.first()
        if today_data:
            print(f"  - Sessions: {today_data.sessions}")
            print(f"  - Active Users: {today_data.active_users}")
            print(f"  - Page Views: {today_data.screen_page_views}")
            print(f"  - Bounce Rate: {today_data.bounce_rate:.2f}%")
    else:
        print("  - No data found for today")

except User.DoesNotExist:
    print("❌ User not found with ID 1")

print("\n✅ Test complete!")
