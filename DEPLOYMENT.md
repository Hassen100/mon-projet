# 🚀 Guide de Déploiement - SEO Dashboard

Ce guide explique comment déployer le SEO Dashboard sur Vercel avec le backend Django et le frontend Angular.

## 📋 Prérequis

- Compte Vercel (gratuit)
- Compte GitHub
- Base de données PostgreSQL (recommandée pour la production)
- Compte Google Cloud Platform (pour Google Analytics)

## 🔧 Étape 1: Configuration GitHub

1. **Créer un nouveau dépôt GitHub**
   - Nom: `seo-dashboard`
   - Description: SEO Dashboard with Django backend and Angular frontend
   - Public ou Privé selon vos besoins

2. **Pusher le code sur GitHub**
```bash
# Ajouter le remote GitHub
git remote add origin https://github.com/votre-username/seo-dashboard.git

# Pusher vers GitHub
git push -u origin main
```

## 🌐 Étape 2: Configuration Vercel

### 2.1 Importer le projet sur Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer sur "New Project"
3. Importer le dépôt GitHub
4. Vercel détectera automatiquement le projet

### 2.2 Configuration du Build

Vercel utilisera la configuration du fichier `vercel.json`:

```json
{
  "version": 2,
  "name": "seo-dashboard",
  "builds": [
    {
      "src": "seo_dashboard_backend/wsgi.py",
      "use": "@vercel/python"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/seo-dashboard"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/seo_dashboard_backend/wsgi.py"
    },
    {
      "src": "/admin/(.*)",
      "dest": "/seo_dashboard_backend/wsgi.py"
    },
    {
      "src": "/(.*)",
      "dest": "/seo_dashboard_backend/wsgi.py"
    }
  ],
  "env": {
    "DJANGO_SETTINGS_MODULE": "config.settings.production"
  },
  "functions": {
    "seo_dashboard_backend/wsgi.py": {
      "runtime": "python3.9"
    }
  },
  "installCommand": "pip install -r seo_dashboard_backend/requirements.txt",
  "buildCommand": "cd seo_dashboard_backend && python manage.py collectstatic --noinput",
  "outputDirectory": "seo_dashboard_backend/staticfiles",
  "framework": "django"
}
```

## 🔐 Étape 3: Variables d'Environnement Vercel

Dans le dashboard Vercel, ajouter ces variables d'environnement:

### Variables requises

| Nom | Valeur | Description |
|------|--------|-------------|
| `SECRET_KEY` | `votre-clé-secrète-django` | Clé secrète Django (générer une longue clé aléatoire) |
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` | Settings de production Django |
| `DB_NAME` | `seo_dashboard` | Nom de la base de données |
| `DB_USER` | `votre-user-db` | Utilisateur base de données |
| `DB_PASSWORD` | `votre-password-db` | Mot de passe base de données |
| `DB_HOST` | `votre-host-db` | Hôte base de données |
| `DB_PORT` | `5432` | Port base de données |

### Variables optionnelles

| Nom | Valeur | Description |
|------|--------|-------------|
| `PROPERTY_ID` | `votre-ga4-property-id` | ID propriété Google Analytics |
| `SERVICE_ACCOUNT_FILE` | `service_account.json` | Fichier de service Google Analytics |
| `EMAIL_HOST` | `smtp.gmail.com` | Serveur email |
| `EMAIL_PORT` | `587` | Port email |
| `EMAIL_HOST_USER` | `votre-email@gmail.com` | Email pour notifications |
| `EMAIL_HOST_PASSWORD` | `votre-app-password` | Mot de passe application Gmail |

## 🗄️ Étape 4: Configuration Base de Données

### Option 1: PostgreSQL (Recommandé)

1. **Créer une base de données PostgreSQL**
   - Utiliser [Supabase](https://supabase.com) (gratuit)
   - Ou [Railway](https://railway.app)
   - Ou [Heroku Postgres](https://www.heroku.com/postgres)

2. **Configurer les variables d'environnement**
   ```
   DB_NAME=seo_dashboard
   DB_USER=postgres
   DB_PASSWORD=votre-password
   DB_HOST=your-host.supabase.co
   DB_PORT=5432
   ```

### Option 2: MySQL

Si vous préférez rester avec MySQL:
1. Utiliser un service MySQL cloud (PlanetScale, Railway)
2. Mettre à jour la configuration dans `settings_production.py`

## 📊 Étape 5: Configuration Google Analytics

1. **Créer un projet Google Cloud Platform**
2. **Activer l'API Google Analytics Data**
3. **Créer un compte de service**
4. **Télécharger le fichier JSON**
5. **Uploader le fichier sur Vercel** ou utiliser les variables d'environnement

## 🚀 Étape 6: Déploiement

### Déploiement Automatique

Après avoir configuré les variables d'environnement, chaque push sur `main` déclenchera automatiquement un déploiement.

```bash
# Faire des changements
git add .
git commit -m "feat: Add new feature"
git push origin main
```

### Déploiement Manuel

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

## 🔍 Étape 7: Vérification du Déploiement

### 1. Vérifier l'API Backend

```bash
# Tester les endpoints d'authentification
curl -X POST https://your-app.vercel.app/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","first_name":"Test","last_name":"User","password":"TestPassword123!","password_confirm":"TestPassword123!"}'
```

### 2. Vérifier le Frontend

- Accéder à: `https://your-app.vercel.app`
- Vérifier que toutes les pages fonctionnent
- Tester l'authentification

### 3. Vérifier l'Admin Django

- Accéder à: `https://your-app.vercel.app/admin`
- Se connecter avec le superutilisateur

## 🐛 Dépannage

### Erreurs Communes

1. **ModuleNotFoundError: No module named 'django'**
   - Vérifier que `requirements.txt` est correct
   - Vérifier la version Python dans `vercel.json`

2. **Database connection failed**
   - Vérifier les variables d'environnement DB_*
   - S'assurer que la base de données est accessible

3. **CORS errors**
   - Ajouter votre domaine Vercel dans `CORS_ALLOWED_ORIGINS`
   - Vérifier la configuration dans `settings_production.py`

4. **Static files not found**
   - Vérifier que `collectstatic` s'exécute correctement
   - Vérifier `STATIC_ROOT` configuration

### Logs Vercel

1. Aller sur le dashboard Vercel
2. Cliquer sur votre projet
3. Onglet "Logs" pour voir les erreurs en temps réel
4. Onglet "Functions" pour les logs des fonctions serverless

## 📈 Monitoring

### Métriques à surveiller

- **Performance**: Temps de réponse des API
- **Erreurs**: Taux d'erreur 4xx/5xx
- **Utilisation**: Nombre de requêtes par jour
- **Base de données**: Connexions et performances

### Alertes

Configurer des alertes Vercel pour:
- Taux d'erreur > 5%
- Temps de réponse > 2s
- Échecs de déploiement

## 🔄 Mises à Jour

### Mise à jour du Backend

```bash
# Faire des changements dans le code
git add .
git commit -m "feat: Update backend"
git push origin main
```

### Mise à jour du Frontend

```bash
# Faire des changements Angular
npm run build
git add .
git commit -m "feat: Update frontend"
git push origin main
```

### Mise à jour des Dépendances

```bash
# Backend
pip freeze > requirements.txt
git add requirements.txt
git commit -m "chore: Update Python dependencies"

# Frontend
npm update
git add package.json package-lock.json
git commit -m "chore: Update Node dependencies"
```

## 🔒 Sécurité en Production

1. **Clés secrètes**: Ne jamais committer de clés secrètes
2. **HTTPS**: Vercel fournit automatiquement HTTPS
3. **Headers de sécurité**: Configurés dans `settings_production.py`
4. **Rate limiting**: Configurer si nécessaire
5. **Backups**: Sauvegarder régulièrement la base de données

---

**Support**: En cas de problème, vérifier d'abord les logs Vercel, puis la configuration des variables d'environnement.
