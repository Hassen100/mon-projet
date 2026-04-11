#!/usr/bin/env python
import os
import sys

# Ajouter le chemin du backend
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from django.conf import settings

print("🔍 Vérification de la configuration d'authentification Django:")

# Vérifier REST Framework
if 'rest_framework' in settings.INSTALLED_APPS:
    print("✅ REST Framework est installé")
else:
    print("❌ REST Framework n'est pas installé")

# Vérifier la configuration REST Framework
if hasattr(settings, 'REST_FRAMEWORK'):
    print(f"✅ Configuration REST Framework: {settings.REST_FRAMEWORK}")
else:
    print("❌ Pas de configuration REST_FRAMEWORK trouvée")

# Vérifier les middleware d'authentification
auth_middleware = []
for middleware in settings.MIDDLEWARE:
    if 'auth' in middleware.lower():
        auth_middleware.append(middleware)

print(f"✅ Middleware d'authentification: {auth_middleware}")

# Vérifier les applications d'authentification
auth_apps = []
for app in settings.INSTALLED_APPS:
    if 'auth' in app.lower():
        auth_apps.append(app)

print(f"✅ Apps d'authentification: {auth_apps}")

# Vérifier les validateurs de mots de passe
print(f"✅ Validateurs de mots de passe: {len(settings.AUTH_PASSWORD_VALIDATORS)} validateurs")

# Vérifier les utilisateurs
from django.contrib.auth.models import User
print(f"✅ Nombre d'utilisateurs dans la base: {User.objects.count()}")

for user in User.objects.all()[:5]:
    print(f"  - {user.username} (staff: {user.is_staff}, superuser: {user.is_superuser})")
