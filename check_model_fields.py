#!/usr/bin/env python
import os
import sys

# Ajouter le chemin du backend
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from api.models import GoogleAnalyticsData
from django.contrib.auth.models import User

print("🔍 Vérification des champs du modèle GoogleAnalyticsData:")

# Utiliser l'utilisateur test@test.com
user = User.objects.get(username='test@test.com')
analytics_data = GoogleAnalyticsData.objects.filter(user=user).first()

if analytics_data:
    print(f"Champs disponibles pour GoogleAnalyticsData:")
    for field in analytics_data._meta.fields:
        print(f"  - {field.name}: {field.__class__.__name__} (value: {getattr(analytics_data, field.name)})")
    
    print(f"\nValeurs spécifiques:")
    print(f"  sessions: {analytics_data.sessions}")
    print(f"  active_users: {analytics_data.active_users}")
    print(f"  screen_page_views: {analytics_data.screen_page_views}")
    print(f"  bounce_rate: {analytics_data.bounce_rate}")
    # Vérifier si avg_session_duration existe
    try:
        print(f"  avg_session_duration: {analytics_data.avg_session_duration}")
    except AttributeError:
        print("  avg_session_duration: N'EXISTE PAS")
else:
    print("Aucune donnée trouvée")
