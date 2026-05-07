#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import GoogleIntegrationConfig
from django.contrib.auth.models import User

try:
    user = User.objects.get(id=1)
    config = GoogleIntegrationConfig.objects.get(user=user)
    
    print("\n=== SAVED GOOGLE CREDENTIALS ===")
    print(f"\n1. GA Property ID: {config.ga_property_id}")
    if config.ga_credentials_json:
        print(f"   GA Credentials keys: {list(config.ga_credentials_json.keys())}")
        # Check for required fields
        required_fields = ['client_email', 'private_key', 'token_uri', 'type']
        missing = [f for f in required_fields if f not in config.ga_credentials_json]
        if missing:
            print(f"   ❌ MISSING REQUIRED FIELDS: {missing}")
        else:
            print(f"   ✅ All required fields present")
    else:
        print("   ❌ NO GA CREDENTIALS SAVED")
    
    print(f"\n2. GSC Site URL: {config.gsc_site_url}")
    if config.gsc_credentials_json:
        print(f"   GSC Credentials keys: {list(config.gsc_credentials_json.keys())}")
        required_fields = ['client_email', 'private_key', 'token_uri', 'type']
        missing = [f for f in required_fields if f not in config.gsc_credentials_json]
        if missing:
            print(f"   ❌ MISSING REQUIRED FIELDS: {missing}")
        else:
            print(f"   ✅ All required fields present")
    else:
        print("   ❌ NO GSC CREDENTIALS SAVED")
        
except Exception as e:
    print(f"Error: {e}")
