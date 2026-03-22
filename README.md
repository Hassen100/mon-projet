# SEO Pulse Board — Projet SEO-IA 📊

Dashboard analytique SEO avec authentification, construit en **Angular 17** (Standalone Components).

---

## 🚀 Installation et lancement

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en développement
npm start
# → http://localhost:4200

# 3. Build pour production
npm run build:prod
# → dist/seo-ia/
```

---

## 📁 Structure du projet

```
src/
├── index.html                    ← Tag Google Analytics G-H6L4CJQ6J8
├── main.ts
├── styles.scss                   ← Variables CSS globales
└── app/
    ├── app.component.ts          ← Root component (router-outlet)
    ├── app.config.ts             ← Providers (router, http, animations)
    ├── app.routes.ts             ← Routes avec AuthGuard
    ├── guards/
    │   └── auth.guard.ts         ← Protège /dashboard
    ├── services/
    │   └── auth.service.ts       ← Login/Register (localStorage)
    ├── auth/
    │   ├── login/                ← Page de connexion
    │   └── register/             ← Page d'inscription
    └── dashboard/                ← Dashboard principal
```

---

## 🔐 Authentification

- **Register** (`/register`) : crée un compte stocké en `localStorage`
- **Login** (`/login`) : connexion, session en `sessionStorage`
- **Guard** : redirige vers `/login` si non connecté
- **Déconnexion** : bouton dans le header du dashboard

---

## 📊 Fonctionnalités du Dashboard

- 4 KPIs : Sessions, Utilisateurs, Pages vues, Taux de rebond
- Graphique ligne : Trafic organique sur 30 jours
- Graphique barre : Top mots-clés par clics
- Graphique doughnut : Rebond par source
- Tableau : Pages les plus consultées
- Tableau : Mots-clés performants avec position et CTR
- Panel IA : 6 recommandations SEO priorisées
- Filtres : Date, URL, Source
- Boutons : Appliquer filtres, Vérifier URL, Sync Google, Générer IA

---

## 🌐 Déploiement Vercel

```bash
# Push sur GitHub → Vercel détecte automatiquement Angular
# Build command : npm run build:prod
# Output dir    : dist/seo-ia/browser

# Le fichier vercel.json gère le routing SPA (rewrites)
```

---

## 📈 Google Analytics

Tag `G-H6L4CJQ6J8` intégré dans `src/index.html`.
Stream URL : `https://dashboard-seo-mu.vercel.app/`
