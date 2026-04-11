#!/usr/bin/env python
import os
import sys
import django
from pathlib import Path

# Add the backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings

print("="*60)
print("DATABASE CONFIGURATION DEBUG")
print("="*60)
print(f"Database Engine: {settings.DATABASES['default']['ENGINE']}")
print(f"Database Name: {settings.DATABASES['default']['NAME']}")
print("="*60)
