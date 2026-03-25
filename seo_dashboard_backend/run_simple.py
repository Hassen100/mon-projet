#!/usr/bin/env python
"""
Simple Django server without WSGI complications
"""

import os
import sys
import json
from wsgiref.simple_server import make_server
from urllib.parse import parse_qs

# Configuration
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

# Initialize Django
import django
django.setup()

# Import our services
from analytics.services import analytics_service

def simple_app(environ, start_response):
    """Simple WSGI application for testing the API with CORS support."""
    
    # Get the path
    path = environ.get('PATH_INFO', '')
    method = environ.get('REQUEST_METHOD', 'GET')
    origin = environ.get('HTTP_ORIGIN', '')
    
    # Set up response with CORS headers
    status = '200 OK'
    headers = [
        ('Content-type', 'application/json'),
        ('Access-Control-Allow-Origin', '*'),
        ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
        ('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    ]
    
    # Handle preflight OPTIONS requests
    if method == 'OPTIONS':
        start_response(status, headers)
        return [b'']
    
    start_response(status, headers)
    
    # Route handling
    try:
        if path == '/api/analytics/health/':
            response_data = {
                "status": "healthy",
                "service": "SEO Analytics API",
                "property_id": "526389101",
                "version": "1.0.0"
            }
            
        elif path == '/api/analytics/overview/':
            overview_data = analytics_service.get_overview_data()
            response_data = overview_data
            
        elif path == '/api/analytics/traffic/':
            # Parse query parameters
            query_string = environ.get('QUERY_STRING', '')
            params = parse_qs(query_string)
            days = int(params.get('days', [30])[0])
            
            traffic_data = analytics_service.get_traffic_data(days=days)
            response_data = traffic_data
            
        elif path == '/api/analytics/pages/':
            # Parse query parameters
            query_string = environ.get('QUERY_STRING', '')
            params = parse_qs(query_string)
            limit = int(params.get('limit', [10])[0])
            
            pages_data = analytics_service.get_pages_data(limit=limit)
            response_data = pages_data
            
        elif path == '/api/analytics/sync/' and method == 'POST':
            # For POST, we'd need to read the request body
            # For now, just return the sync data
            sync_data = analytics_service.sync_all_data()
            response_data = sync_data
            
        else:
            status = '404 Not Found'
            response_data = {"error": "Endpoint not found"}
        
    except Exception as e:
        status = '500 Internal Server Error'
        response_data = {"error": "Internal server error", "details": str(e)}
    
    # Return JSON response
    response_json = json.dumps(response_data, indent=2, default=str)
    return [response_json.encode('utf-8')]

def main():
    """Start the simple server."""
    
    print("🚀 Starting SEO Analytics Backend Server")
    print("=" * 50)
    print("🌐 Server: http://127.0.0.1:8000")
    print("📊 API Endpoints:")
    print("   GET  /api/analytics/health/")
    print("   GET  /api/analytics/overview/")
    print("   GET  /api/analytics/traffic/?days=30")
    print("   GET  /api/analytics/pages/?limit=10")
    print("   POST /api/analytics/sync/")
    print("=" * 50)
    print("🔍 Test in browser: http://127.0.0.1:8000/api/analytics/health/")
    print("⏹️  Press Ctrl+C to stop the server")
    print()
    
    try:
        # Create and run the server
        server = make_server('127.0.0.1', 8000, simple_app)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    main()
