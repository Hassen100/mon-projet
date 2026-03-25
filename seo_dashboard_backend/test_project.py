#!/usr/bin/env python
"""
Test script to validate project structure and configuration.
"""

import os
import sys
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists and print status."""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath} (MISSING)")
        return False

def check_directory_structure():
    """Validate the complete project structure."""
    print("🔍 Checking SEO Analytics Backend Project Structure")
    print("=" * 60)
    
    base_path = Path(__file__).parent
    required_files = [
        (base_path / "manage.py", "Django manage.py"),
        (base_path / "requirements.txt", "Requirements file"),
        (base_path / "service_account.json", "Google Service Account"),
        (base_path / "README.md", "Documentation"),
        (base_path / ".gitignore", "Git ignore file"),
        (base_path / "setup.py", "Setup script"),
    ]
    
    # Config files
    config_path = base_path / "config"
    config_files = [
        (config_path / "__init__.py", "Config package init"),
        (config_path / "settings.py", "Django settings"),
        (config_path / "urls.py", "Main URLs"),
        (config_path / "wsgi.py", "WSGI config"),
        (config_path / "asgi.py", "ASGI config"),
    ]
    
    # Analytics app files
    analytics_path = base_path / "analytics"
    analytics_files = [
        (analytics_path / "__init__.py", "Analytics package init"),
        (analytics_path / "models.py", "Analytics models"),
        (analytics_path / "views.py", "Analytics views"),
        (analytics_path / "urls.py", "Analytics URLs"),
        (analytics_path / "serializers.py", "Analytics serializers"),
        (analytics_path / "services.py", "Analytics services"),
        (analytics_path / "admin.py", "Analytics admin"),
        (analytics_path / "apps.py", "Analytics app config"),
    ]
    
    all_files = required_files + config_files + analytics_files
    
    missing_files = []
    existing_files = []
    
    for filepath, description in all_files:
        if check_file_exists(filepath, description):
            existing_files.append(filepath)
        else:
            missing_files.append(filepath)
    
    print("\n" + "=" * 60)
    print(f"📊 Summary:")
    print(f"   ✅ Files present: {len(existing_files)}")
    print(f"   ❌ Files missing: {len(missing_files)}")
    
    if missing_files:
        print(f"\n🔧 Missing files:")
        for filepath in missing_files:
            print(f"   - {filepath}")
    
    return len(missing_files) == 0

def check_service_account_config():
    """Check if service account file has proper structure."""
    print("\n🔐 Checking Service Account Configuration")
    print("-" * 40)
    
    service_account_path = Path(__file__).parent / "service_account.json"
    
    if not service_account_path.exists():
        print("❌ Service account file not found")
        return False
    
    try:
        import json
        with open(service_account_path, 'r') as f:
            data = json.load(f)
        
        required_keys = ['type', 'project_id', 'private_key', 'client_email']
        missing_keys = [key for key in required_keys if key not in data]
        
        if missing_keys:
            print(f"❌ Missing keys in service account: {missing_keys}")
            return False
        
        print("✅ Service account file has proper structure")
        print(f"   Project ID: {data.get('project_id', 'N/A')}")
        print(f"   Client Email: {data.get('client_email', 'N/A')}")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in service account file: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading service account file: {e}")
        return False

def check_django_settings():
    """Check Django settings configuration."""
    print("\n⚙️ Checking Django Settings")
    print("-" * 30)
    
    settings_path = Path(__file__).parent / "config" / "settings.py"
    
    if not settings_path.exists():
        print("❌ Django settings file not found")
        return False
    
    try:
        with open(settings_path, 'r') as f:
            content = f.read()
        
        required_configs = [
            'PROPERTY_ID',
            'SERVICE_ACCOUNT_FILE',
            'INSTALLED_APPS',
            'REST_FRAMEWORK',
            'CORS_ALLOWED_ORIGINS'
        ]
        
        missing_configs = [config for config in required_configs if config not in content]
        
        if missing_configs:
            print(f"❌ Missing configurations: {missing_configs}")
            return False
        
        print("✅ Django settings has required configurations")
        
        # Check for property ID
        if 'PROPERTY_ID = "526389101"' in content:
            print("✅ Property ID configured correctly")
        else:
            print("⚠️ Property ID may need updating")
        
        return True
        
    except Exception as e:
        print(f"❌ Error reading settings file: {e}")
        return False

def print_api_endpoints():
    """Print the available API endpoints."""
    print("\n🚀 Available API Endpoints")
    print("-" * 30)
    
    endpoints = [
        "GET  /api/analytics/overview/     - Overview metrics",
        "GET  /api/analytics/traffic/?days=30 - Traffic data",
        "GET  /api/analytics/pages/?limit=10 - Top pages",
        "POST /api/analytics/sync/          - Sync all data",
        "GET  /api/analytics/health/         - Health check",
    ]
    
    for endpoint in endpoints:
        print(f"   {endpoint}")

def main():
    """Run all validation checks."""
    print("🎯 SEO Analytics Backend Validation")
    print("=" * 60)
    
    structure_ok = check_directory_structure()
    service_ok = check_service_account_config()
    settings_ok = check_django_settings()
    
    print_api_endpoints()
    
    print("\n" + "=" * 60)
    print("📋 Final Status:")
    print(f"   📁 Structure: {'✅ OK' if structure_ok else '❌ Issues'}")
    print(f"   🔐 Service Account: {'✅ OK' if service_ok else '❌ Issues'}")
    print(f"   ⚙️ Settings: {'✅ OK' if settings_ok else '❌ Issues'}")
    
    if structure_ok and service_ok and settings_ok:
        print("\n🎉 Project is ready for deployment!")
        print("\n📝 Next Steps:")
        print("   1. Install dependencies: pip install -r requirements.txt")
        print("   2. Run migrations: python manage.py migrate")
        print("   3. Start server: python manage.py runserver")
        print("   4. Test API: http://localhost:8000/api/analytics/health/")
        return True
    else:
        print("\n🔧 Please fix the issues above before proceeding.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
