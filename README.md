# 🚀 SEO Dashboard - Backend Django + Frontend Angular

[![Deployed with Vercel](https://vercel.com/button)](https://vercel.com)
[![Django](https://img.shields.io/badge/Django-4.2.7-green.svg)](https://www.djangoproject.com/)
[![Angular](https://img.shields.io/badge/Angular-15-red.svg)](https://angular.io/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)

Un dashboard SEO complet avec backend Django REST Framework et frontend Angular, intégrant Google Analytics et un système d'authentification JWT robuste.

## 📋 Fonctionnalités

### 🔐 Authentification & Sécurité
- ✅ Système d'authentification JWT avec refresh tokens
- ✅ Modèle utilisateur personnalisé avec profils étendus
- ✅ Blacklist de tokens pour une déconnexion sécurisée
- ✅ Interface admin Django pour la gestion des utilisateurs
- ✅ Validation des mots de passe et sécurité renforcée

### 📊 Analytics SEO
- ✅ Intégration Google Analytics Data API
- ✅ Tableaux de bord de trafic en temps réel
- ✅ Analyse des performances SEO
- ✅ Export des données et rapports personnalisés

### 🛠️ Architecture Technique
- ✅ Backend Django REST Framework + MySQL
- ✅ Frontend Angular 15 avec TypeScript
- ✅ API RESTful complète et documentée
- ✅ Déploiement continu sur Vercel
- ✅ Tests automatisés et documentation

## 🏗️ Architecture du Projet

```
mon-projet/
├── seo_dashboard_backend/          # Backend Django
│   ├── authentication/            # App authentification
│   │   ├── models.py             # Modèles utilisateur
│   │   ├── serializers.py        # API serializers
│   │   ├── views.py             # Vues API
│   │   └── urls.py              # URLs auth
│   ├── config/                   # Configuration Django
│   │   ├── settings.py           # Settings dev
│   │   └── settings_production.py # Settings prod
│   ├── analytics/                # App analytics
│   └── requirements.txt          # Dépendances Python
├── src/                          # Frontend Angular
│   ├── app/
│   │   ├── auth/                # Modules auth
│   │   ├── dashboard/           # Dashboard principal
│   │   └── services/           # Services HTTP
│   └── angular.json             # Config Angular
├── vercel.json                   # Configuration Vercel
├── package.json                  # Dépendances Node.js
└── README.md                    # Documentation
```

## 🚀 Démarrage Rapide

### Prérequis
- Python 3.11+
- Node.js 16+
- MySQL (XAMPP recommandé)
- Angular CLI 15+

### Installation Backend

1. **Cloner le dépôt**
```bash
git clone https://github.com/votre-username/seo-dashboard.git
cd seo-dashboard
```

2. **Environnement virtuel Python**
```bash
cd seo_dashboard_backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. **Installation des dépendances**
```bash
pip install -r requirements.txt
```

4. **Configuration base de données**
```bash
# Créer la base de données MySQL
mysql -u root -e "CREATE DATABASE seo_dashboard;"

# Appliquer les migrations
python manage.py makemigrations
python manage.py migrate
```

5. **Créer un superutilisateur**
```bash
python manage.py createsuperuser
```

6. **Démarrer le serveur**
```bash
python manage.py runserver 127.0.0.1:8001
```

### Installation Frontend

1. **Installation des dépendances**
```bash
npm install
```

2. **Démarrer le serveur de développement**
```bash
npm start
```

3. **Accéder à l'application**
- Frontend: http://localhost:4200
- Backend API: http://localhost:8001/api
- Admin Django: http://localhost:8001/admin

## 🌐 API Documentation

### Endpoints d'Authentification

| Méthode | Endpoint | Description |
|---------|-----------|-------------|
| POST | `/api/auth/register/` | Inscription utilisateur |
| POST | `/api/auth/login/` | Connexion avec JWT |
| GET | `/api/auth/profile/` | Profil utilisateur |
| PATCH | `/api/auth/profile/update/` | Mise à jour profil |
| POST | `/api/auth/logout/` | Déconnexion sécurisée |
| POST | `/api/auth/token/refresh/` | Rafraîchir token |

### Endpoints Analytics

| Méthode | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/analytics/traffic/` | Données de trafic |
| GET | `/api/analytics/performance/` | Performances SEO |
| GET | `/api/analytics/reports/` | Rapports personnalisés |

## 🔧 Configuration

### Variables d'Environnement

Créer un fichier `.env` à la racine du projet:

```env
# Django Settings
SECRET_KEY=votre-secret-key-production
DEBUG=False
ALLOWED_HOSTS=.vercel.app,localhost

# Database (Production)
DB_NAME=seo_dashboard
DB_USER=votre-user-db
DB_PASSWORD=votre-password-db
DB_HOST=votre-host-db
DB_PORT=5432

# Google Analytics
PROPERTY_ID=votre-ga4-property-id
SERVICE_ACCOUNT_FILE=service_account.json

# Email (Optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-app-password
```

## 🧪 Tests

### Tests Backend

```bash
cd seo_dashboard_backend

# Tests d'authentification complets
python test_auth_complete.py

# Tests Django
python manage.py test

# Vérifier la configuration
python manage.py check --deploy
```

### Tests Frontend

```bash
# Lancer les tests unitaires
npm test

# Tests end-to-end
npm run e2e
```

## 🚀 Déploiement

### Déploiement sur Vercel

1. **Connecter Vercel à GitHub**
```bash
npm install -g vercel
vercel login
vercel link
```

2. **Configurer les variables d'environnement Vercel**
- `SECRET_KEY`: Clé secrète Django
- `DB_*`: Configuration base de données
- `PROPERTY_ID`: ID propriété Google Analytics
- `DJANGO_SETTINGS_MODULE`: `config.settings.production`

3. **Déployer**
```bash
vercel --prod
```

## 📊 Monitoring & Logs

### Logs Django
Les logs sont configurés pour la production:
- Fichier: `django.log`
- Niveaux: ERROR, INFO, DEBUG
- Rotation automatique

### Monitoring Vercel
- Dashboard Vercel pour les métriques
- Logs temps réel
- Alertes personnalisées

## 🔒 Sécurité

### JWT Tokens
- Access tokens: 15 minutes (production)
- Refresh tokens: 1 jour (production)
- Blacklist automatique après déconnexion
- Rotation des refresh tokens

### Sécurité Django
- CSRF protection activée
- Secure headers configurés
- HSTS activé en production
- Cookies sécurisés

---

**Développé avec ❤️ par votre équipe SEO Dashboard**
