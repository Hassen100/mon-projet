# API d'Authentification Django + MySQL (XAMPP)

## 🚀 Overview

Backend d'authentification complet construit avec Django REST Framework et JWT, connecté à une base de données MySQL via XAMPP.

## 📋 Fonctionnalités

- ✅ Inscription d'utilisateurs
- ✅ Connexion avec JWT
- ✅ Accès au profil utilisateur
- ✅ Mise à jour du profil
- ✅ Déconnexion (blacklist de token)
- ✅ Modèle utilisateur personnalisé
- ✅ Interface d'administration Django

## 🔧 Configuration

### Base de données MySQL
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'seo_dashboard',
        'USER': 'root',
        'PASSWORD': '',
        'HOST': '127.0.0.1',
        'PORT': '3306',
    }
}
```

### Modèle Utilisateur Personnalisé
```python
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

## 🌐 Endpoints API

### 1. Inscription
**POST** `/api/auth/register/`

```json
{
    "email": "user@example.com",
    "username": "username",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!"
}
```

**Réponse (201):**
```json
{
    "message": "Utilisateur créé avec succès",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "username": "username",
        "first_name": "John",
        "last_name": "Doe",
        "is_verified": false,
        "created_at": "2026-03-31T11:11:46.401278",
        "profile": {
            "bio": "",
            "avatar": null,
            "phone": "",
            "address": ""
        }
    }
}
```

### 2. Connexion
**POST** `/api/auth/login/`

```json
{
    "email": "user@example.com",
    "password": "SecurePassword123!"
}
```

**Réponse (200):**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "username": "username",
        "first_name": "John",
        "last_name": "Doe",
        "is_verified": false,
        "created_at": "2026-03-31T11:11:46.401278",
        "profile": {...}
    }
}
```

### 3. Profil Utilisateur
**GET** `/api/auth/profile/`

Headers: `Authorization: Bearer <access_token>`

**Réponse (200):**
```json
{
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "first_name": "John",
    "last_name": "Doe",
    "is_verified": false,
    "created_at": "2026-03-31T11:11:46.401278",
    "profile": {
        "bio": "Ma bio",
        "avatar": null,
        "phone": "+212600000000",
        "address": "Mon adresse"
    }
}
```

### 4. Mise à jour Profil
**PATCH** `/api/auth/profile/update/`

Headers: `Authorization: Bearer <access_token>`

```json
{
    "first_name": "Updated",
    "last_name": "Name",
    "profile": {
        "bio": "Ceci est ma bio mise à jour",
        "phone": "+212600000000",
        "address": "Rue test, Ville test"
    }
}
```

### 5. Déconnexion
**POST** `/api/auth/logout/`

```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 6. Liste des Utilisateurs (Admin)
**GET** `/api/auth/users/`

Headers: `Authorization: Bearer <access_token>`

### 7. Détail Utilisateur (Admin)
**GET** `/api/auth/users/<id>/`

Headers: `Authorization: Bearer <access_token>`

### 8. Refresh Token
**POST** `/api/auth/token/refresh/`

```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## 🔐 Configuration JWT

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': 'your-secret-key',
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

## 🗄️ Structure de la Base de Données

### Table authentication_customuser
- id (BigAutoField, Primary Key)
- email (EmailField, Unique)
- username (CharField, Unique)
- first_name (CharField)
- last_name (CharField)
- password (CharField)
- is_verified (BooleanField)
- is_active (BooleanField)
- is_staff (BooleanField)
- is_superuser (BooleanField)
- created_at (DateTimeField)
- updated_at (DateTimeField)

### Table authentication_userprofile
- id (BigAutoField, Primary Key)
- user_id (ForeignKey to CustomUser)
- bio (TextField)
- avatar (ImageField)
- phone (CharField)
- address (TextField)

## 🧪 Tests

Lancer le script de test complet :
```bash
python test_auth.py
```

## 🚀 Démarrage du Serveur

```bash
# Démarrer le serveur de développement
python manage.py runserver 127.0.0.1:8001

# Lancer les migrations
python manage.py makemigrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser
```

## 📦 Dépendances

```
django==4.2.7
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0
mysqlclient==2.2.0
Pillow==10.0.1
django-cors-headers==4.3.1
```

## 🔧 Administration

Accéder à l'administration : http://127.0.0.1:8001/admin/

Gérer les utilisateurs et leurs profils via l'interface Django admin.

## 🛡️ Sécurité

- Tokens JWT avec expiration configurable
- Blacklist des tokens refresh après déconnexion
- Validation des mots de passe Django
- Protection CSRF activée
- Configuration CORS pour le frontend

## 📝 Notes

- Le serveur fonctionne sur le port 8001 pour éviter les conflits
- Les tokens d'accès expirent après 60 minutes
- Les tokens de refresh expirent après 7 jours
- Les mots de passe doivent respecter les validateurs Django
- Les avatars sont stockés dans le dossier `media/avatars/`
