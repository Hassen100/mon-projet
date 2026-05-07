#!/usr/bin/env python
"""Run the Django development server with the SQLite settings module."""
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_sqlite')

if __name__ == '__main__':
    from django.conf import settings
    from django.core.management import execute_from_command_line

    print(f"[RUNSERVER] Using database: {settings.DATABASES['default']['ENGINE']}")
    print(f"[RUNSERVER] Database file: {settings.DATABASES['default']['NAME']}")
    execute_from_command_line(['manage.py', 'runserver', '127.0.0.1:8000'])
