#!/usr/bin/env python
"""
Simplified server startup script for SEO Analytics Backend
"""

import os
import sys
import subprocess

def main():
    """Start the Django development server with proper configuration."""
    
    # Set environment variables
    os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
    
    # Add current directory to Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)
    
    print("🚀 Starting SEO Analytics Backend Server...")
    print("=" * 50)
    
    try:
        # Test Django configuration
        import django
        from django.core.management import execute_from_command_line
        
        django.setup()
        print("✅ Django configuration loaded successfully")
        
        # Start development server
        print("🌐 Starting server on http://127.0.0.1:8001")
        print("📊 API will be available at: http://127.0.0.1:8001/api/analytics/")
        print("🔍 Health check: http://127.0.0.1:8001/api/analytics/health/")
        print("=" * 50)
        
        execute_from_command_line(['manage.py', 'runserver', '127.0.0.1:8001'])
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure Django is installed: pip install django")
        return False
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
