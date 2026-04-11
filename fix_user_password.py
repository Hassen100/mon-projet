#!/usr/bin/env python
import os
import sys

# Ajouter le chemin du backend
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

print("🔧 Configuration des mots de passe pour les utilisateurs...")

# Définir un mot de passe pour test@test.com
try:
    user = User.objects.get(username='test@test.com')
    user.set_password('password123')
    user.save()
    print(f"✅ Mot de passe défini pour {user.username}")
    
    # Créer un token
    token, created = Token.objects.get_or_create(user=user)
    print(f"✅ Token: {token.key} (créé: {created})")
    
except User.DoesNotExist:
    print("❌ Utilisateur test@test.com non trouvé")

# Définir un mot de passe pour hassen
try:
    user = User.objects.get(username='hassen')
    user.set_password('password123')
    user.save()
    print(f"✅ Mot de passe défini pour {user.username}")
    
    # Créer un token
    token, created = Token.objects.get_or_create(user=user)
    print(f"✅ Token: {token.key} (créé: {created})")
    
except User.DoesNotExist:
    print("❌ Utilisateur hassen non trouvé")

print("\n👥 Liste des utilisateurs avec leurs rôles:")
for user in User.objects.all():
    print(f"  - {user.username} (staff: {user.is_staff}, superuser: {user.is_superuser})")

print(f"\n✅ Configuration terminée !")
print(f"📝 Utilisez 'password123' comme mot de passe pour tous les utilisateurs")
