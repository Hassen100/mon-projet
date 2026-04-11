# Pipeline de flux des données - Architecture détaillée

## 🔄 Flux de données global

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Angular Frontend (Browser)                       │
│  GoogleConfigComponent → setGoogleConfig() → Store credentials      │
│  AnalyticsDashboardComponent → refreshData() → Load analytics       │
└────────────────────────────────────┬────────────────────────────────┘
                                     ↓
                            HTTP REST API Calls
                                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Django Backend API (Python)                       │
│  /api/google-config/     → Save credentials to database             │
│  /api/analytics/summary/ → Fetch from Google Analytics API v4       │
│  /api/search/summary/    → Fetch from Google Search Console API     │
└────────────────────────────────────┬────────────────────────────────┘
                                     ↓
                          Database (MySQL/XAMPP)
                                     ↓
                    Google APIs (Authentication)
                                     ↓
                          Google Infrastructure
```

---

## 📋 Détail de chaque flux

### 1️⃣ Configuration des credentials

```
┌─────────────────────────────────────────────────────────────────┐
│ GoogleConfigComponent                                            │
│ - User entre GA4 Property ID                                    │
│ - User colle GA credentials JSON                                │
│ - User entre GSC Site URL                                       │
│ - User colle GSC credentials JSON                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓ analyticsService.setGoogleConfig(userId, config)
                 │
┌────────────────────────────────────────────────────────────────┐
│ HTTP POST /api/google-config/                                  │
│ {                                                               │
│   "user_id": 1,                                                │
│   "ga_property_id": "531307647",                              │
│   "ga_credentials": {...},                                    │
│   "gsc_site_url": "https://site.com",                        │
│   "gsc_credentials": {...}                                   │
│ }                                                              │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓ views.set_google_config()
                 │
┌────────────────────────────────────────────────────────────────┐
│ Django Backend                                                  │
│ - Récupère le user                                            │
│ - Crée/Update GoogleIntegrationConfig                         │
│ - Sauvegarde les credentials en BDD                           │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓ Save to MySQL
                 │
┌────────────────────────────────────────────────────────────────┐
│ Database (XAMPP/MySQL)                                          │
│ INSERT INTO api_googleintegrationconfig                         │
│ (user_id, ga_property_id, ga_credentials, gsc_site_url,...)   │
└────────────────────────────────────────────────────────────────┘
                 ↑
                 │ Returns: {"message": "Success", "config": {...}}
                 │
          Google Config Component
          - Affiche success message
          - Efface le formulaire
```

---

### 2️⃣ Récupération des données Google Analytics

```
┌──────────────────────────────────────────────────────────────────┐
│ AnalyticsDashboardComponent (Angular)                            │
│ ngOnInit() {                                                     │
│   this.analyticsService.getAnalyticsSummary(userId, 30)         │
│ }                                                                 │
└─────────────┬──────────────────────────────────────────────────┘
              │
              ↓ HTTP GET /api/analytics/summary/?user_id=1&days=30
              │
┌──────────────────────────────────────────────────────────────────┐
│ Django Backend: views.get_analytics_summary()                    │
│ 1. Récupère User(id=1) depuis BDD                              │
│ 2. Récupère GoogleIntegrationConfig(user=user)                 │
│ 3. Vérifie que ga_property_id et ga_credentials existent       │
└─────────────┬──────────────────────────────────────────────────┘
              │
              ↓ Crée GoogleAnalyticsService avec credentials
              │
┌──────────────────────────────────────────────────────────────────┐
│ google_analytics_service.py: GoogleAnalyticsService              │
│                                                                  │
│ 1. __init__(credentials_json, property_id)                      │
│    - Parse les credentials JSON                                 │
│    - Crée Credentials object depuis service account             │
│    - Initialise BetaAnalyticsDataClient                        │
│                                                                  │
│ 2. save_analytics_data(user, days=30)                          │
│    - Appelle get_analytics_data(30)                            │
│    - Appelle get_top_pages(limit=20)                           │
│    - Sauvegarde dans GoogleAnalyticsData                        │
│    - Sauvegarde dans GoogleAnalyticsPageData                    │
└─────────────┬──────────────────────────────────────────────────┘
              │
              ↓ Requête Google Analytics Data API v4
              │
┌──────────────────────────────────────────────────────────────────┐
│ Google Infrastructure                                            │
│ GET https://analyticsdata.googleapis.com/v1beta/properties/..   │
│                                                                  │
│ Retourne:                                                        │
│ {                                                                │
│   "rows": [{                                                     │
│     "dimension_values": ["2026-04-06"],                         │
│     "metric_values": [                                          │
│       {"value": "1234"},  // sessions                           │
│       {"value": "567"},   // activeUsers                        │
│       {"value": "2345"},  // screenPageViews                    │
│       {"value": "42.5"}   // bounceRate                         │
│     ]                                                            │
│   }]                                                             │
│ }                                                                │
└─────────────┬──────────────────────────────────────────────────┘
              │
              ↓ Parse et agrège les données
              │
┌──────────────────────────────────────────────────────────────────┐
│ Retour Django Backend en JSON                                    │
│ {                                                                │
│   "analytics": {                                                │
│     "sessions": 1234,                                           │
│     "active_users": 567,                                        │
│     "screen_page_views": 2345,                                  │
│     "bounce_rate": 42.5                                         │
│   }                                                              │
│ }                                                                │
└─────────────┬──────────────────────────────────────────────────┘
              │
              ↓ HTTP 200 + JSON Response
              │
┌──────────────────────────────────────────────────────────────────┐
│ Angular Service (analytics.service.ts)                           │
│ Observable<AnalyticsSummary> (reçoit et parse la réponse)      │
└─────────────┬──────────────────────────────────────────────────┘
              │
              ↓ Passe au Component via Subscribe
              │
┌──────────────────────────────────────────────────────────────────┐
│ AnalyticsDashboardComponent                                       │
│ this.analyticsSummary = data                                    │
│                                                                  │
│ Template affiche:                                               │
│ <div class="kpi-value">{{ analyticsSummary.analytics.sessions }} │
│                                                                  │
│ Output: "1234"                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

### 3️⃣ Récupération des Google Search Console Data Top Queries

```
┌──────────────────────────────────────────────────────────────────┐
│ AnalyticsDashboardComponent (Angular)                            │
│ this.analyticsService.getTopQueries(userId, 30, 10)            │
└─────────────┬──────────────────────────────────────────────────┘
              │
              ↓ HTTP GET /api/search/top-queries/?user_id=1&days=30&limit=10
              │
┌──────────────────────────────────────────────────────────────────┐
│ Django Backend: views.get_top_queries()                          │
│ 1. Récupère User et GoogleIntegrationConfig                    │
│ 2. Vérifie que gsc_site_url et gsc_credentials existent         │
└─────────────┬──────────────────────────────────────────────────┘
              │
              ↓ Crée GoogleSearchConsoleService
              │
┌──────────────────────────────────────────────────────────────────┐
│ google_search_console_service.py: GoogleSearchConsoleService    │
│                                                                  │
│ 1. __init__(credentials_json, site_url)                         │
│    - Parse les credentials JSON                                 │
│    - Crée Credentials object avec scope webmasters              │
│    - Construit service client webmasters v3                     │
│                                                                  │
│ 2. get_top_queries(limit=10, days=30)                           │
│    - Requête API Search Console                                 │
│    - dimensions: ["query"]                                     │
│    - metrics: ["clicks", "impressions", "ctr", "position"]     │
│    - orderBy: [{"sortBy": "clicks", "direction": "DESC"}]      │
└─────────────┬──────────────────────────────────────────────────┘
              │
              ↓ Requête Google Search Console API
              │
┌──────────────────────────────────────────────────────────────────┐
│ Google Search Console Infrastructure                             │
│ POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/  │
│           searchanalytics/query                                  │
│                                                                  │
│ Retourne:                                                        │
│ {                                                                │
│   "rows": [                                                      │
│     {                                                            │
│       "keys": ["freelancing"],                                  │
│       "clicks": 145,                                            │
│       "impressions": 3421,                                      │
│       "ctr": 0.0424,                                            │
│       "position": 5.2                                           │
│     },                                                           │
│     {                                                            │
│       "keys": ["seo tips"],                                     │
│       "clicks": 89,                                             │
│       "impressions": 2104,                                      │
│       "ctr": 0.0423,                                            │
│       "position": 12.8                                          │
│     }                                                            │
│   ]                                                              │
│ }                                                                │
└─────────────┬──────────────────────────────────────────────────┘
              │
              ↓ Parse et formate en endpoint
              │
┌──────────────────────────────────────────────────────────────────┐
│ Retour Django Backend en JSON                                    │
│ {                                                                │
│   "queries": [                                                   │
│     {                                                            │
│       "query": "freelancing",                                   │
│       "clicks": 145,                                            │
│       "impressions": 3421,                                      │
│       "ctr": 4.24,        // Converti en pourcentage           │
│       "position": 5.2                                           │
│     },                                                           │
│     {                                                            │
│       "query": "seo tips",                                      │
│       "clicks": 89,                                             │
│       "impressions": 2104,                                      │
│       "ctr": 4.23,                                              │
│       "position": 12.8                                          │
│     }                                                            │
│   ]                                                              │
│ }                                                                │
└─────────────┬──────────────────────────────────────────────────┘
              │
              ↓ HTTP 200 + JSON Response
              │
┌──────────────────────────────────────────────────────────────────┐
│ Angular Template (analytics-dashboard.component.ts)              │
│                                                                  │
│ <table>                                                          │
│   <tr *ngFor="let query of topQueries">                         │
│     <td>{{ query.query }}</td>                                  │
│     <td>{{ query.clicks | number }}</td>                        │
│     <td>{{ query.impressions | number }}</td>                   │
│     <td>{{ query.ctr.toFixed(2) }}%</td>                        │
│     <td>{{ query.position.toFixed(1) }}</td>                    │
│   </tr>                                                          │
│ </table>                                                         │
│                                                                  │
│ Output:                                                          │
│ freelancing  | 145 | 3421  | 4.24% | 5.2                      │
│ seo tips     | 89  | 2104  | 4.23% | 12.8                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Stockage en Base de données

### Modèle GoogleAnalyticsPageData
```sql
INSERT INTO api_googleanalyticspage_data 
(user_id, page_path, screen_page_views, sessions, date, created_at, updated_at)
VALUES
(1, '/blog/seo-tips', 456, 234, '2026-04-06', NOW(), NOW()),
(1, '/services/freelancing', 389, 198, '2026-04-06', NOW(), NOW()),
(1, '/', 2145, 954, '2026-04-06', NOW(), NOW());
```

### Modèle GoogleSearchConsoleData
```sql
INSERT INTO api_googlesearchconsole_data
(user_id, query, clicks, impressions, ctr, position, date, created_at, updated_at)
VALUES
(1, 'freelancing', 145, 3421, 0.0424, 5.2, '2026-04-06', NOW(), NOW()),
(1, 'seo tips', 89, 2104, 0.0423, 12.8, '2026-04-06', NOW(), NOW());
```

---

## ⚙️ Flux avec Graphiques (Chart.js)

```
AnalyticsDashboardComponent.ngOnInit()
           ↓
analyticsService.getAnalyticsGraphData(userId, 30)
           ↓
/api/analytics/graph/?user_id=1&days=30
           ↓
GoogleAnalyticsService.get_daily_data()
           ↓
Google Analytics API (dimensions: ["date"])
           ↓
Response:
[
  {"date": "2026-03-07", "sessions": 123, "active_users": 56, "page_views": 345},
  {"date": "2026-03-08", "sessions": 145, "active_users": 67, "page_views": 389},
  ...
]
           ↓
Passe au template via Observable
           ↓
initAnalyticsChart(data)
           ↓
chart.js Canvas Element (id="analyticsChart")
           ↓
📊 Graphique affiché avec 3 séries (sessions, users, pageviews)
```

---

## 📊 Résumé des endpoints et leur rôle

| Endpoint | Méthode | Purpose | Retour |
|----------|---------|---------|--------|
| `/api/google-config/` | POST | Sauvegarder credentials | `{message, config}` |
| `/api/analytics/summary/` | GET | KPIs GA (sessions, users, bounce) | `{analytics: {...}}` |
| `/api/analytics/top-pages/` | GET | Top 20 pages GA | `{pages: [...]}` |
| `/api/analytics/graph/` | GET | Données journalières GA | `{daily_data: [...]}` |
| `/api/search/summary/` | GET | KPIs GSC (clicks, impressions) | `{search: {...}}` |
| `/api/search/top-queries/` | GET | Top 20 mots-clés | `{queries: [...]}` |
| `/api/search/pages/` | GET | Top 20 pages GSC | `{pages: [...]}` |
| `/api/search/graph/` | GET | Données journalières GSC | `{daily_data: [...]}` |

---

## 🔐 Flux d'authentification Google

```
1. Service Account JSON reçu
           ↓
2. Credentials.from_service_account_info() crée un token
           ↓
3. Google vérifie la signature RSA
           ↓
4. Google retourne un access_token valide 1 heure
           ↓
5. Client utilise le token pour les requêtes API
           ↓
6. Si expiré, token auto-refresh (transparent)
```

---

**Cette architecture assure la séparation des responsabilités et la maintenabilité du code! 🎯**
