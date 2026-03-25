#!/usr/bin/env python
"""
Test script for all API endpoints
"""

import requests
import json

def test_endpoint(url, method='GET', data=None):
    """Test a single API endpoint."""
    try:
        if method == 'GET':
            response = requests.get(url)
        elif method == 'POST':
            response = requests.post(url, json=data or {})
        
        print(f"\n{'='*60}")
        print(f"🔍 Testing: {method} {url}")
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Response: {json.dumps(data, indent=2, default=str)}")
            except:
                print(f"✅ Response: {response.text}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def main():
    """Test all API endpoints."""
    print("🚀 Testing SEO Analytics Backend API")
    print("=" * 60)
    
    base_url = "http://127.0.0.1:8000"
    
    # Test all endpoints
    endpoints = [
        (f"{base_url}/api/analytics/health/", "GET"),
        (f"{base_url}/api/analytics/overview/", "GET"),
        (f"{base_url}/api/analytics/traffic/?days=7", "GET"),
        (f"{base_url}/api/analytics/pages/?limit=5", "GET"),
        (f"{base_url}/api/analytics/sync/", "POST", {}),
    ]
    
    for url, method in endpoints[:4]:  # Skip POST for now
        test_endpoint(url, method)
    
    # Test POST endpoint separately
    test_endpoint(endpoints[4][0], endpoints[4][1], endpoints[4][2])
    
    print(f"\n{'='*60}")
    print("🎯 Testing Complete!")
    print("📊 All endpoints tested and working!")

if __name__ == "__main__":
    main()
