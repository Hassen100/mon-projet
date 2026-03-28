# 🚀 Guide de Déploiement Production

## Problème Actuel
- ✅ Frontend Angular : Déployé sur Vercel
- ❌ Backend Django : Non déployé
- ❌ Données Google Analytics : Ne fonctionnent pas en production

## Solutions

### Option 1 : Déployer Backend Django (Recommandé)

#### 1. Railway
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Créer nouveau projet
railway new

# Déployer le backend
cd seo_dashboard_backend
railway up
```

#### 2. Heroku
```bash
# Installer Heroku CLI
# Créer app Heroku
heroku create your-app-name

# Déployer
cd seo_dashboard_backend
git subtree push --prefix seo_dashboard_backend heroku main
```

#### 3. Render.com
- Créer compte sur https://render.com
- Connecter repository GitHub
- Déployer `seo_dashboard_backend/` comme Web Service

### Option 2 : Serverless Functions (Vercel)

Créer des API routes Vercel dans `/api` :

```javascript
// pages/api/analytics/overview.js
export default async function handler(req, res) {
  // Appeler Google Analytics API directement
  // Retourner les données
}
```

### Option 3 : Firebase Functions

```javascript
// functions/src/analytics.ts
export const getOverview = functions.https.onRequest(async (req, res) => {
  // Logique Google Analytics
});
```

## Configuration Production

### 1. Mettre à jour l'URL de l'API
Dans `src/app/services/analytics.service.ts` :

```typescript
// Local
private baseUrl = 'http://127.0.0.1:8000/api/analytics';

// Production
private baseUrl = 'https://your-backend-url.com/api/analytics';
```

### 2. Variables d'environnement
Configurer les secrets :
- `GOOGLE_APPLICATION_CREDENTIALS`
- `PROPERTY_ID`
- `DATABASE_URL`

### 3. CORS
Mettre à jour les origines autorisées :
```python
CORS_ALLOWED_ORIGINS = [
    "https://dashboard-seo-mu.vercel.app",
    "https://your-domain.com"
]
```

## Étapes Rapides

1. **Choisir une plateforme** (Railway recommandé)
2. **Déployer le backend**
3. **Mettre à jour l'URL API** dans Angular
4. **Redéployer sur Vercel**
5. **Tester en production**

## Coûts Estimés

- **Railway** : ~$5-20/mois
- **Heroku** : ~$7/mois (Hobby tier)
- **Render** : ~$7/mois
- **Vercel Functions** : Usage-based
- **Firebase** : Usage-based

## Alternative Gratuite

Utiliser **Vercel Serverless Functions** pour éviter les coûts de backend dédié.
