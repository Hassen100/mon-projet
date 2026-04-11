#!/usr/bin/env python
"""
Alternative runserver that bypasses Django's migration check which fails with MySQL
"""
import os
import sys
import django
from pathlib import Path

# Setup Django FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# NOW after setup, patch the settings
from django.conf import settings

# Override the connection configuration
settings.DATABASES['default'] = {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': str(Path(settings.BASE_DIR) / 'db.sqlite3'),
}

# Force a fresh connection pool with new config
from django.db import connections
connections.close_all()

print(f"[RUNSERVER] Using database: {settings.DATABASES['default']['ENGINE']}")
print(f"[RUNSERVER] Database file: {settings.DATABASES['default']['NAME']}")

# NOW we can safely run the development server
if __name__ == '__main__':
    from django.core.management.commands.runserver import Command
    cmd = Command()
    cmd.execute(['127.0.0.1:8000'], verbosity=2, interactive=True, use_reloader=True, use_threaded_loader=False)
