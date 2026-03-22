# 🚀 Build & Deployment Configuration

## 📋 Configuration complète pour le déploiement

### 🔧 Fichiers de configuration créés

#### **1. vercel.json**
```json
{
  "version": 2,
  "name": "dashboard-seo",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/dashboard-seo"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html",
      "status": 200
    }
  ],
  "build": {
    "env": {
      "NODE_VERSION": "18"
    }
  },
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "dist/dashboard-seo",
  "framework": "angular"
}
```

#### **2. .vercelignore**
Exclut les fichiers inutiles du déploiement:
- `node_modules`
- `dist`
- Fichiers d'environnement
- Fichiers IDE/OS

#### **3. angular.json modifié**
- `outputPath`: `"dist/dashboard-seo"`
- Configurations production/development
- Budgets optimisés

#### **4. Environments**
- **Development**: `http://localhost:5000/api`
- **Production**: `https://dashboard-24-five.vercel.app/api`

## 🏗️ Build Commands

### **Local Development**
```bash
# Installation
npm install

# Démarrer serveur de développement
ng serve

# Build développement
ng build

# Build production
ng build --configuration production
```

### **Build Optimisé**
```bash
# Build avec optimisation
ng build --configuration production --optimization

# Build avec source maps (debug)
ng build --configuration production --source-map

# Build avec analyse de bundle
ng build --configuration production --stats-json
```

## 🚀 Déploiement

### **1. Vercel (Recommandé)**
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod

# Configuration automatique via vercel.json
```

#### **Variables d'environnement Vercel**
```
NODE_VERSION=18
ANGULAR_ENV=production
```

### **2. Netlify**
```bash
# Build command
ng build --configuration production

# Publish directory
dist/dashboard-seo

# Redirect rules
/*    /index.html   200
```

### **3. GitHub Pages**
```bash
# Build
ng build --configuration production --base-href "/repository-name/"

# Déployer
npx angular-cli-ghpages --dir=dist/dashboard-seo
```

### **4. Firebase Hosting**
```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Build
ng build --configuration production

# Déployer
firebase deploy --only hosting
```

## 🔍 Vérification du Build

### **1. Tests de build**
```bash
# Build test
ng build --configuration production

# Vérifier la taille
du -sh dist/dashboard-seo

# Analyser les bundles
npx webpack-bundle-analyzer dist/dashboard-seo/stats.json
```

### **2. Tests locaux**
```bash
# Serveur de production local
npx serve dist/dashboard-seo

# Tests E2E
ng e2e
```

## 📊 Optimisations

### **Performance**
- **Lazy loading** des modules
- **Tree shaking** automatique
- **Minification** CSS/JS
- **Compression** Gzip/Brotli
- **Cache** headers optimisés

### **Budgets configurés**
```json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "500kb",
    "maximumError": "1mb"
  },
  {
    "type": "anyComponentStyle",
    "maximumWarning": "2kb",
    "maximumError": "4kb"
  }
]
```

## 🌐 Déploiement Automatisé

### **GitHub Actions**
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build --configuration production
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### **Vercel Git Integration**
1. Connecter repository GitHub à Vercel
2. Configuration automatique via `vercel.json`
3. Déploiement sur chaque push `main`

## 🔧 Debugging

### **Build Errors**
```bash
# Verbose build
ng build --configuration production --verbose

# Clean build
rm -rf dist/ node_modules/.cache
ng build --configuration production
```

### **Common Issues**
- **Memory**: Augmenter `Node.js heap size`
- **Timeout**: Augmenter `build timeout`
- **Dependencies**: `npm ci` vs `npm install`

## 📈 Monitoring

### **Vercel Analytics**
- Performance metrics
- Core Web Vitals
- Error tracking
- User analytics

### **Build Performance**
- Build time tracking
- Bundle size monitoring
- Dependency analysis

---

**Configuration complète pour un déploiement optimisé!** 🚀📊
