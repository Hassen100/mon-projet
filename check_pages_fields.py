#!/usr/bin/env python
import os
import sys

# Ajouter le chemin du backend
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from api.models import GoogleAnalyticsPageData
from django.contrib.auth.models import User

print("🔍 Vérification des champs du modèle GoogleAnalyticsPageData:")

# Utiliser l'utilisateur test@test.com
user = User.objects.get(username='test@test.com')
pages_data = GoogleAnalyticsPageData.objects.filter(user=user).first()

if pages_data:
    print(f"Champs disponibles pour GoogleAnalyticsPageData:")
    for field in pages_data._meta.fields:
        print(f"  - {field.name}: {field.__class__.__name__} (value: {getattr(pages_data, field.name)})")
else:
    print("Aucune donnée trouvée")
