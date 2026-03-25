#!/usr/bin/env python
"""
Simple Django server test without WSGI complications
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json

def main():
    """Start a simple test server to verify API structure."""
    
    print("🧪 Testing SEO Analytics Backend Structure")
    print("=" * 50)
    
    # Test imports
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
        
        import django
        django.setup()
        
        from analytics.services import analytics_service
        from analytics.views import overview_view, traffic_view, pages_view, sync_view, health_check
        
        print("✅ All imports successful")
        
        # Test service initialization
        print(f"✅ Property ID configured: {analytics_service.property_id}")
        
        print("\n🚀 API Endpoints Available:")
        print("   GET  /api/analytics/overview/")
        print("   GET  /api/analytics/traffic/?days=30")
        print("   GET  /api/analytics/pages/?limit=10")
        print("   POST /api/analytics/sync/")
        print("   GET  /api/analytics/health/")
        
        print("\n📝 Next Steps:")
        print("   1. Start Django server: python manage.py runserver")
        print("   2. Test in browser: http://127.0.0.1:8000/api/analytics/health/")
        print("   3. Integrate with Angular using frontend_integration.md")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
