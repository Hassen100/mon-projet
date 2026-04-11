#!/usr/bin/env python
"""CRITICAL DEBUG: Check what database Django actually loads"""

# DO NOT import Django settings first - check environment first
import os
import sys

print("=== ENVIRONMENT VARS ===")
print(f"DJANGO_SETTINGS_MODULE: {os.getenv('DJANGO_SETTINGS_MODULE', 'NOT SET')}")
print(f"DATABASE_URL: {os.getenv('DATABASE_URL', 'NOT SET')}")
print(f"PYTHONPATH: {os.getenv('PYTHONPATH', 'NOT SET')}")
print(f"Python Version: {sys.version}")
print(f"Current Dir: {os.getcwd()}")
print(f"sys.path: {sys.path[:3]}")

# NOW import Django and check settings
print("\n=== IMPORTING DJANGO ===")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
print(f"Django path: {django.__file__}")
print(f"Django version: {django.__version__}")

from django.conf import settings
print(f"\nDJANGO SETTINGS MODULE: {settings.SETTINGS_MODULE}")
print(f"\nFULL DATABASES CONFIG:")
import json
for alias, config in settings.DATABASES.items():
    print(f"  {alias}:")
    print(f"    ENGINE: {config['ENGINE']}")
    print(f"    NAME: {config.get('NAME', 'N/A')}")
    print(f"    HOST: {config.get('HOST', 'N/A')}")

# NOW try to initialize connections
print("\n=== INITIALIZING CONNECTIONS ===")
from django.db import connections, DEFAULT_DB_ALIAS

print(f"DEFAULT_DB_ALIAS: {DEFAULT_DB_ALIAS}")
print(f"CONNECTION AVAILABLE: {DEFAULT_DB_ALIAS in connections}")

# Get the connection without actually connecting
conn = connections[DEFAULT_DB_ALIAS]
print(f"Connection object: {conn}")
print(f"Connection settings_dict: {conn.settings_dict}")

print("\n=== SUCCESS ===")
print("If you got here without errors, Django is NOT trying MySQL!")
