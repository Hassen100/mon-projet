# Configuration Google Analytics & Google Search Console

## Guide de configuration complet

### 1. **ALERTE SÉCURITÉ**
Les secrets Google fournis précédemment sont compromis. Vous DEVEZ:
- [ ] Aller dans [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Supprimer les service accounts compromis
- [ ] Créer de nouveaux service accounts
- [ ] Télécharger les nouvelles clés JSON

### 2. **Installation des dépendances Python**

```bash
cd backend
pip install -r requirements.txt
```

### 3. **Créer les migrations Django**

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. **Configuration de la base de données**

Assurez-vous que XAMPP est en cours d'exécution avec:
- MySQL sur le port 3307 (ou configuré dans .env)
- Base de données `backend` créée

Vérifier la connexion:
```bash
python manage.py dbshell
```

### 5. **Endpoints API créés**

#### Configuration Google
```
POST   /api/google-config/
```
Body:
```json
{
  "user_id": 1,
  "ga_property_id": "531307647",
  "ga_credentials": { /* credentials JSON */ },
  "gsc_site_url": "https://votre-site.com",
  "gsc_credentials": { /* credentials JSON */ }
}
```

#### Google Analytics
```
GET    /api/analytics/summary/    - Résumé (sessions, utilisateurs, taux de rebond)
GET    /api/analytics/top-pages/  - Pages les plus consultées
GET    /api/analytics/graph/      - Données journalières pour graphiques
```

Query params:
- `user_id` (requis)
- `days` (optionnel, défaut=30)
- `limit` (optionnel pour top-pages, défaut=20)

#### Google Search Console
```
GET    /api/search/summary/       - Résumé (clicks, impressions, CTR, position)
GET    /api/search/top-queries/   - Mots-clés les plus performants
GET    /api/search/pages/         - Pages les plus performantes en recherche
GET    /api/search/graph/         - Données journalières pour graphiques
```

### 6. **Structure des données en base**

Models créés:
- `GoogleAnalyticsData` - Données agrégées d'analytics
- `GoogleAnalyticsPageData` - Données par page
- `GoogleSearchConsoleData` - Données par requête  
- `GoogleSearchConsolePageData` - Données par page GSC
- `GoogleIntegrationConfig` - Configuration des credentials

### 7. **Test des APIs**

Après configuration, tester avec curl:

```bash
# Configuration
curl -X POST http://localhost:8000/api/google-config/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "ga_property_id": "531307647",
    "ga_credentials": {...},
    "gsc_site_url": "https://site.com",
    "gsc_credentials": {...}
  }'

# Récupérer les résumés
curl "http://localhost:8000/api/analytics/summary/?user_id=1&days=30"
curl "http://localhost:8000/api/search/summary/?user_id=1&days=30"
```

### 8. **Intégration Angular**

Le service `AnalyticsService` est prêt à l'emploi. Exemple d'utilisation dans un composant:

```typescript
export class DashboardComponent implements OnInit {
  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    const userId = 1; // À récupérer de localStorage/authentification
    
    this.analyticsService.getAnalyticsSummary(userId).subscribe(
      (data) => {
        console.log('Analytics:', data);
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }
}
```

### 9. **Architecture complète**

```
Angular Dashboard (seo-dashboard)
        ↓ API calls
Django Backend (backend)
   ├─ Google Analytics Service  ─→ Google Analytics Data API
   └─ GSC Service              ─→ Google Search Console API
        ↓ Store
MySQL Database (XAMPP)
```

### 10. **Prochaines étapes**

1. ✅ Créer les modèles Django
2. ✅ Créer les services Google
3. ✅ Créer les endpoints API
4. ⏭️ Créer les migrations et appliquer
5. ⏭️ Tester les endpoints
6. ⏭️ Créer les composants Angular pour affichage
7. ⏭️ Intégrer les graphiques (Chart.js existe déjà)

### Notes importantes

- Les credentials Google NE DOIVENT JAMAIS être stockés dans le code source
- Utilisez des variables d'environnement en production
- Les métadonnées CTR et position de GSC sont en float (penser à arrondir côté frontend)
- GA4 utilise des métriques différentes de l'ancienne version Universal Analytics
