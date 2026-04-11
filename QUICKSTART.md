# 🚀 QUICKSTART - 15 minutes pour mettre en marche

## ✅ Checklist d'implémentation

### Phase 1: Sécurité (URGENT - 5 min)
- [ ] 🚨 Aller à [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Supprimer les 2 service accounts compromis
- [ ] Créer de nouveaux service accounts GA4 et GSC
- [ ] Télécharger les JSONs des nouvelles clés
- [ ] **GARDER CES CLÉ SECRÈTES** (ne pas les partager!)

### Phase 2: Installation Backend (3 min)
```bash
# Terminal - Dans le dossier backend
cd backend
pip install -r requirements.txt

# Vérifier l'installation
python manage.py runserver --nothreading
# Vous devriez voir "Starting development server..."
```

### Phase 3: Base de données (2 min)
```bash
# Toujours dans /backend
python manage.py makemigrations
python manage.py migrate
```

Vérifier:
```bash
python manage.py dbshell
# Vous devriez pouvoir vous connecter à MySQL
```

### Phase 4: Configuration Google dans Angular (3 min)
1. Démarrer le Django server: `python manage.py runserver`
2. Dans une autre terminal, démarrer Angular: `cd seo-dashboard && ng serve`
3. Aller à: `http://localhost:4200/google-config`
4. Remplir le formulaire:
   - **Property ID**: `531307647`
   - **GA Credentials**: Coller le JSON GA4 complet
   - **Site URL**: `https://seo-ia123.vercel.app/` (ou votre URL)
   - **GSC Credentials**: Coller le JSON GSC complet
5. Cliquer: "Sauvegarder Configuration" ✅

### Phase 5: Test (2 min)
1. Aller à: `http://localhost:4200/analytics`
2. Vérifier que les KPIs s'affichent ✅
3. Vérifier que les tables se chargent ✅
4. Si erreur: Lire la console (F12 → Console tab)

---

## 📋 Fichiers créés/modifiés (Résumé)

### Backend Django

**Modèles** → [backend/api/models.py](backend/api/models.py)
- ✅ GoogleAnalyticsData
- ✅ GoogleAnalyticsPageData  
- ✅ GoogleSearchConsoleData
- ✅ GoogleSearchConsolePageData
- ✅ GoogleIntegrationConfig

**Services** → Nouveaux fichiers
- ✅ [backend/api/google_analytics_service.py](backend/api/google_analytics_service.py)
- ✅ [backend/api/google_search_console_service.py](backend/api/google_search_console_service.py)

**API Views** → [backend/api/views.py](backend/api/views.py)
- ✅ set_google_config()
- ✅ get_analytics_summary()
- ✅ get_top_pages()
- ✅ get_analytics_graph_data()
- ✅ get_search_summary()
- ✅ get_top_queries()
- ✅ get_search_pages()
- ✅ get_search_graph_data()

**Routes** → [backend/api/urls.py](backend/api/urls.py)
- ✅ 8 routes configurées

**Dépendances** → [backend/requirements.txt](backend/requirements.txt)
- ✅ google-analytics-data
- ✅ google-api-python-client
- ✅ google-auth-oauthlib
- ✅ google-auth-httplib2
- ✅ python-dateutil

### Frontend Angular

**Service** → [seo-dashboard/src/app/services/analytics.service.ts](seo-dashboard/src/app/services/analytics.service.ts)
- ✅ AnalyticsService (8 méthodes)

**Composants** → Nouveaux fichiers
- ✅ [GoogleConfigComponent](seo-dashboard/src/app/components/google-config/)
  - Formulaire configuration
  - Test des APIs
  
- ✅ [AnalyticsDashboardComponent](seo-dashboard/src/app/components/analytics-dashboard/)
  - 4 KPI Analytics
  - 4 KPI Search Console
  - Tables de données
  - Graphiques Chart.js

### Documentation
- ✅ [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Vue d'ensemble
- ✅ [GOOGLE_INTEGRATION_SETUP.md](GOOGLE_INTEGRATION_SETUP.md) - Détails technique
- ✅ [ANGULAR_INTEGRATION_GUIDE.md](ANGULAR_INTEGRATION_GUIDE.md) - Routing Angular
- ✅ [DATA_FLOW_ARCHITECTURE.md](DATA_FLOW_ARCHITECTURE.md) - Architecture flux données
- ✅ [QUICKSTART.md](QUICKSTART.md) - Ce fichier!

---

## 🔧 Commandes utiles

### Django
```bash
# Démarrer le serveur
python manage.py runserver

# Créer migrations
python manage.py makemigrations

# Appliquer migrations
python manage.py migrate

# Se connecter à la BDD
python manage.py dbshell

# Créer un admin
python manage.py createsuperuser

# Shell interactive
python manage.py shell
```

### Angular
```bash
# Démarrer dev server
ng serve

# Build production
ng build --configuration production

# Tests
ng test
```

### Tester les APIs avec curl
```bash
# Configurer Google
curl -X POST http://localhost:8000/api/google-config/ \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"ga_property_id":"531307647","ga_credentials":{...}}'

# Récupérer résumé analytics
curl "http://localhost:8000/api/analytics/summary/?user_id=1&days=30"

# Récupérer top pages
curl "http://localhost:8000/api/analytics/top-pages/?user_id=1&days=30&limit=10"

# Récupérer mots-clés
curl "http://localhost:8000/api/search/top-queries/?user_id=1&days=30&limit=10"
```

---

## 🆘 Problèmes courants & Solutions

### ❌ "Google Analytics not configured"
**Solution**: Allez à `/google-config` et sauvegardez les credentials

### ❌ "Invalid credentials" 
**Solution**: Vérifiez que le JSON est valide:
```bash
# Testez le JSON dans Python
python -c "import json; json.load(open('credentials.json'))"
```

### ❌ "Connection refused to localhost:3307"
**Solution**: Assurez-vous XAMPP est actif avec MySQL

### ❌ Les données ne s'affichent pas
**Solution**: 
1. Vérifiez la console du navigateur (F12)
2. Vérifiez que GA4 a des données (min 1 jour)
3. Vérifiez que GSC a des données (min 1 jour)

### ❌ "CORS error"
**Solution**: Vérifiez que `corsheaders` est installé et configuré dans settings.py

### ❌ "ModuleNotFoundError"
**Solution**: Réinstallez les dépendances:
```bash
pip install -r requirements.txt --upgrade --force-reinstall
```

### ❌ Migrations failed
**Solution**:
```bash
# Supprimer la BDD et recommencer
python manage.py flush
python manage.py migrate
```

---

## 🌐 URLs clés

### Local Development
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:8000`
- Google Config: `http://localhost:4200/google-config`
- Analytics Dashboard: `http://localhost:4200/analytics`
- Django Admin: `http://localhost:8000/admin`

### Production (À configurer)
- Frontend: `https://votre-site.com`
- Backend API: `https://api.votre-site.com`

---

## 📊 Données attendues

### De Google Analytics v4
```javascript
{
  sessions: 1234,           // Total de sessions ce mois
  active_users: 567,        // Utilisateurs actifs
  screen_page_views: 2345,  // Vues de page totales
  bounce_rate: 42.5         // Taux de rebond en %
}
```

### De Google Search Console
```javascript
{
  clicks: 890,              // Clics depuis recherche Google
  impressions: 12345,       // Fois affiché dans résultats
  ctr: 7.21,               // Click-through rate en %
  position: 5.2             // Position moyenne dans résultats
}
```

---

## 🎯 Prochaines étapes (après Phase 5)

1. **Intégration complète**: Ajouter les routes au routing principal
2. **Authentification**: Relier l'userId au système d'auth existant
3. **Synchronisation auto**: Ajouter une tâche Celery pour sync quotidienne
4. **Alertes**: Ajouter notifications si les metrics baissent
5. **Export**: Créer exports PDF des rapports
6. **Comparaisons**: Affiicher les comparaisons période vs période

---

## ✨ Tips pour éviter les problèmes

1. **Toujours démarrer MySQL avant Django** (sinon erreur BDD)
2. **Garder les credentials Google confidentiels** (ne pas commit au git!)
3. **Utiliser des variables d'environnement** pour les secrets
4. **Tester les APIs avec Postman** avant d'intégrer en Angular
5. **Vérifier que GA4/GSC ont des données** avant de faire appels API
6. **Logs**: Lire les logs Django si ça ne marche pas
   ```bash
   # Django logs + Tail
   python manage.py runserver 2>&1 | tee django.log
   ```

---

## 🎓 Architecture Résumée

```
User Browser
    ↓
Angular App (Port 4200)
  - GoogleConfigComponent (Config form)
  - AnalyticsDashboardComponent (Display data)
    ↓
AnalyticsService (HTTP calls)
    ↓
Django Backend (Port 8000)
  - 8 API endpoints
  - GoogleAnalyticsService
  - GoogleSearchConsoleService
    ↓
MySQL Database (XAMPP)
  - 5 Models
    ↓
Google APIs (Cloud)
  - Google Analytics Data API v4
  - Google Search Console API
```

---

**Vous êtes prêt! Commencez par la Phase 1! 🚀**

Si vous avez besoin d'aide:
1. Lire la section "Problèmes courants" ci-dessus
2. Consulter [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) pour plus de détails
3. Vérifier les logs Django/Angular (F12 pour browser)
4. Tester les endpoints avec Postman
