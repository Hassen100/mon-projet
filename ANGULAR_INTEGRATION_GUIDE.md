# Guide d'intégration des composants dans les routes Angular

## 1. Importer les composants dans app.routes.ts

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { GoogleConfigComponent } from './components/google-config/google-config.component';
import { AnalyticsDashboardComponent } from './components/analytics-dashboard/analytics-dashboard.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'google-config',
    component: GoogleConfigComponent,
  },
  {
    path: 'analytics',
    component: AnalyticsDashboardComponent,
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
];
```

## 2. Ajouter un lien de navigation au composant principal

```html
<!-- Dans app.html ou votre header -->
<nav>
  <a href="/dashboard">Dashboard</a>
  <a href="/google-config">Configuration Google</a>
  <a href="/analytics">Analytics & SEO</a>
</nav>
```

## 3. Assurez-vous que HttpClientModule est fourni

```typescript
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ]
});
```

## 4. Mettre à jour l'environnement pour les variables d'environnement

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://ton-api.com',
};
```

## 5. Workflow complet pour l'utilisateur final

### Étape 1: Première visite - Configuration Google
1. Utilisateur visite `/google-config`
2. Il entre son GA4 Property ID (531307647)
3. Il colle le JSON des credentials GA4
4. Il entre l'URL du site (https://seo-ia123.vercel.app/)
5. Il colle le JSON des credentials GSC
6. Clique sur "Sauvegarder Configuration"

### Étape 2: Voir les analytics
1. Utilisateur visite `/analytics`
2. Voit les KPIs Google Analytics (sessions, users, bounce rate)
3. Voit les KPIs Google Search Console (clicks, impressions, CTR, position)
4. Voit les tables top pages et top keywords
5. Peut changer la période (7/30/90 jours)

### Étape 3: Données mises à jour
Les données se mettra à jour:
- Automatiquement au chargement de la page
- Quand on change la période
- Manuellement en rafraîchissant la page (F5)

## 6. Ajouter le rafraîchissement automatique (optionnel)

```typescript
// Dans AnalyticsDashboardComponent, ajouter:
interval?: any;

ngOnInit(): void {
  this.refreshData();
  // Rafraîchir toutes les 30 min
  this.interval = setInterval(() => {
    this.refreshData();
  }, 30 * 60 * 1000);
}

ngOnDestroy(): void {
  if (this.interval) {
    clearInterval(this.interval);
  }
}
```

## 7. Ajouter un bouton de rafraîchissement dans le template

```html
<div class="header">
  <h1>📊 Dashboard Analytics & SEO</h1>
  <div class="controls">
    <button (click)="refreshData()">↻ Rafraîchir</button>
    <select [(ngModel)]="selectedDays" (change)="refreshData()">
      <option value="7">7 jours</option>
      <option value="30">30 jours</option>
      <option value="90">90 jours</option>
    </select>
  </div>
</div>
```

## 8. Intégrer dans le Dashboard existant

Si vous voulez afficher les données GA dans le dashboard principal:

```typescript
// dashboard.component.ts - ajouter
export class DashboardComponent {
  constructor(private analyticsService: AnalyticsService) {}
  
  ngOnInit() {
    // Charger les données GA
    this.analyticsService.getAnalyticsSummary(this.userId).subscribe(
      (data) => {
        this.kpiData.sessions = data.analytics.sessions;
        this.kpiData.users = data.analytics.active_users;
        this.kpiData.pageviews = data.analytics.screen_page_views;
        this.kpiData.bounceRate = data.analytics.bounce_rate;
      }
    );
  }
}
```

## 9. Structure des types TypeScript

Les interfaces sont déjà définies dans `analytics.service.ts`:

```typescript
export interface AnalyticsSummary {
  analytics: {
    sessions: number;
    active_users: number;
    screen_page_views: number;
    bounce_rate: number;
  };
}

export interface TopQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
```

## 10. Gestion des erreurs

```typescript
// Exemple de gestion d'erreur complète
this.analyticsService.getAnalyticsSummary(userId).subscribe(
  (data) => {
    // Succès
    this.analyticsSummary = data;
  },
  (error) => {
    // Erreur
    if (error.status === 404) {
      this.error = 'Configuration non trouvée';
    } else if (error.status === 400) {
      this.error = error.error?.error || 'Google Analytics non configuré';
    } else {
      this.error = 'Erreur serveur';
    }
  },
  () => {
    // Complété
    this.loading = false;
  }
);
```

## 11. Stockage de l'userId depuis localStorage

```typescript
// Dans le constructeur ou init du composant
this.userId = parseInt(localStorage.getItem('user_id') || '1', 10);

// Ou depuis le service d'authentification
constructor(private authService: AuthService) {
  this.userId = this.authService.getCurrentUserId();
}
```

## 12. Testing avec Postman

### 1. Configuration Google
```
POST http://localhost:8000/api/google-config/
Content-Type: application/json

{
  "user_id": 1,
  "ga_property_id": "531307647",
  "ga_credentials": { /* votre JSON */ },
  "gsc_site_url": "https://site.com",
  "gsc_credentials": { /* votre JSON */ }
}
```

### 2. Test Analytics
```
GET http://localhost:8000/api/analytics/summary/?user_id=1&days=30
```

### 3. Test Search Console
```
GET http://localhost:8000/api/search/top-queries/?user_id=1&days=30&limit=10
```

---

**Prêt à intégrer! 🚀**
