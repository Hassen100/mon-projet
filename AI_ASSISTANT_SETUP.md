# 🤖 AI Assistant SEO - Guide d'Utilisation & Configuration

## 📋 Vue d'ensemble

L'**AI Assistant SEO** est intégré dans le dashboard "SEO Pulse Board" (#SEO-IA). C'est un expert SEO IA qui analyse vos données en temps réel.

### ✨ Fonctionnalités

1. **Chat interactif** avec expertise SEO
2. **Analyse contextuelle** des vraies données du dashboard
3. **Recommandations** structurées en 4 catégories :
   - 📄 **Pages à problème** (taux rebond, durée, trafic)
   - 🔍 **Opportunités mots-clés** (positions 4-15)
   - 📉 **Anomalies trafic** (chutes/pics anormaux)
   - ⚙️ **Optimisation technique** (Core Web Vitals)

4. **Réponses** en français avec priorités :
   - 🔴 URGENT (action immédiate)
   - 🟡 IMPORTANT (cette semaine)
   - 🟢 OPTIONNEL (long terme)

---

## 🚀 Accès au Nouveau Feature

### 1. Depuis le Dashboard
**Chemin :** Dashboard → Sidebar gauche → **💬 AI Assistant**

### 2. Boutons présents dans la sidebar
- 📊 Dashboard
- ⚡ PageSpeed
- 🧠 Content Optimizer
- ✨ AI Recommendations
- **💬 AI Assistant** ← NOUVEAU

### 3. URL directe
```
http://localhost:4200/ai-assistant
```

---

## 💻 Configuration Technique Implémentée

### Backend (Django + Python)

#### Fichiers créés/modifiés :
1. **`backend/api/gemini_seo_service.py`** (NOUVEAU)
   - Service Gemini pour l'analyse SEO
   - Récupère le contexte du dashboard
   - Détecte les anomalies de trafic
   - Communique avec Gemini 2.5 Flash

2. **`backend/api/views.py`** (MODIFIÉ)
   - Ajout de 3 endpoints API :
     - `POST /api/ai/chat/` - Chat interactif
     - `GET /api/ai/quick-analysis/` - Analyse rapide
     - `GET /api/ai/context/` - Contexte brut du dashboard

3. **`backend/api/urls.py`** (MODIFIÉ)
   - Routes pour les 3 nouveaux endpoints

4. **`backend/api/serializers_ai.py`** (MODIFIÉ)
   - `AIChatMessageSerializer` - Format requête chat
   - `AIChatResponseSerializer` - Format réponse
   - `AIQuickAnalysisSerializer` - Analyse rapide

5. **`backend/requirements.txt`** (MODIFIÉ)
   - Ajout : `google-generativeai==0.3.0`

#### Configuration requise (.env)
```dotenv
# Déjà configurée dans votre .env :
GEMINI_API_KEY=AIzaSyCVGtyc4apqWNIaoArLGR5Kg-iQaLCnejw
```

### Frontend (Angular 18+)

#### Fichiers créés :
1. **`seo-dashboard/src/app/services/ai-chat.service.ts`** (NOUVEAU)
   - Service TypeScript pour communiquer avec l'API
   - Types/Interfaces pour les données
   - Méthodes :
     - `sendMessage()` - Envoyer au chat
     - `getQuickAnalysis()` - Analyse rapide
     - `getDashboardContext()` - Récupérer contexte

2. **`seo-dashboard/src/app/components/ai-assistant/ai-assistant.component.ts`** (NOUVEAU)
   - Composant Angular du chat
   - Gestion des messages (user/assistant)
   - Auto-scroll
   - Suggestions pré-configurées

3. **`seo-dashboard/src/app/components/ai-assistant/ai-assistant.component.html`** (NOUVEAU)
   - Template chat interactif
   - Affichage des messages
   - Zone de saisie
   - Boutons de suggestions
   - Panneau statistiques

4. **`seo-dashboard/src/app/components/ai-assistant/ai-assistant.component.scss`** (NOUVEAU)
   - Styling avec gradient
   - Design moderne et responsive
   - Animations de messages

#### Fichiers modifiés :
1. **`seo-dashboard/src/app/app.routes.ts`**
   - Route : `/ai-assistant`

2. **`seo-dashboard/src/app/components/dashboard/dashboard.component.html`**
   - Bouton AI Assistant dans sidebar

3. **`seo-dashboard/src/app/components/content-optimizer/content-optimizer.component.html`**
   - Bouton AI Assistant dans sidebar

---

## 📊 Données Intégrées

Le service récupère automatiquement :

### Google Analytics (30 derniers jours)
✅ Sessions totales : 56
✅ Utilisateurs : 34
✅ Pages vues : 228
✅ Taux rebond : 0.61%
✅ Top pages (JSON structuré)

### Google Search Console
✅ Clics : 4
✅ Impressions : 5
✅ CTR moyen : 80%
✅ Position moyenne : 1
✅ Top requêtes (si disponible)

### Anomalies détectées
✅ Chutes > 50% (-92% du 07/04 au 14/04)
✅ Pics > 50%
✅ Taux de changement par date

### Analyse Technique
✅ URLs problématiques
✅ Status codes
✅ Longueur title/meta

---

## 🎯 Cas d'Usage

### Exemple 1 : Identifier les pages problématiques
**Question :** "Quelle page a le taux de rebond le plus élevé ?"
**Réponse :** L'IA analyse et répond avec contexte + recommandations

### Exemple 2 : Détecter les opportunités mots-clés
**Question :** "Quels mots-clés sont en position 4-8 ?"
**Réponse :** Liste structurée avec actions pour remonter

### Exemple 3 : Analyser les anomalies
**Question :** "Le trafic a chuté de 92% entre le 7 et 14 avril, pourquoi ?"
**Réponse :** Hypothèses + plan d'action

### Exemple 4 : Conseils techniques
**Question :** "Quels sont mes problèmes Core Web Vitals ?"
**Réponse :** Priorités + étapes d'optimisation

---

## 🔧 Installation & Déploiement

### Étape 1 : Installer les dépendances Python
```bash
cd backend
pip install -r requirements.txt
```

### Étape 2 : Migration Django (si nécessaire)
```bash
python manage.py migrate
```

### Étape 3 : Démarrer le serveur Django
```bash
python manage.py runserver
```

### Étape 4 : Démarrer Angular
```bash
cd seo-dashboard
npm install
ng serve
```

### Étape 5 : Accéder à l'AI Assistant
```
http://localhost:4200/ai-assistant
```

---

## 🌐 Endpoints API

### 1. Chat Principal
```
POST /api/ai/chat/

Request:
{
  "message": "Analyze my bounce rate",
  "user_id": null,
  "days": 30
}

Response:
{
  "response": "📊 OBSERVATION : Votre taux de rebond...",
  "context_summary": {
    "sessions": 56,
    "users": 34,
    "page_views": 228,
    "clicks": 4,
    "impressions": 5
  },
  "timestamp": "2026-04-15T10:30:00Z"
}
```

### 2. Analyse Rapide
```
GET /api/ai/quick-analysis/?user_id=1&days=30

Response:
{
  "analysis": "1. 🔴 URGENT : Trafic en chute...",
  "dashboard_stats": {
    "sessions": 56,
    "bounce_rate": 0.61,
    "top_pages": [...],
    "search_clicks": 4,
    "avg_position": 1
  }
}
```

### 3. Contexte Brut
```
GET /api/ai/context/?user_id=1&days=30

Response:
{
  "period_days": 30,
  "analytics": { ... },
  "search_console": { ... },
  "anomalies": [...],
  "url_issues": [...]
}
```

---

## 🔑 Clés API Requises

```
GEMINI_API_KEY=AIzaSyCVGtyc4apqWNIaoArLGR5Kg-iQaLCnejw ✅
GA_CREDENTIALS_JSON=... ✅ (déjà configurée)
GSC_CREDENTIALS_JSON=... ✅ (déjà configurée)
```

---

## ⚙️ Configuration Gemini

- **Modèle :** `gemini-2.5-flash`
- **Version :** `google-generativeai==0.3.0`
- **Langue :** Français 🇫🇷
- **Temperatuer :** 0.7 (défaut)

---

## 🎨 UI/UX Features

✅ **Chat interactif** avec messages en temps réel
✅ **Suggestions pré-configurées** (4 boutons)
✅ **Auto-scroll** vers les nouveaux messages
✅ **Indicateur de chargement** ⏳
✅ **Statistiques live** du dashboard
✅ **Responsive design** (mobile/desktop)
✅ **Dark/Light theme ready** (gradient moderne)

---

## 📱 Format des Réponses IA

Chaque réponse respecte ce format :

```
📊 OBSERVATION : [données observées avec vrais chiffres]

⚠️  PROBLÈME : [ce qui ne va pas et pourquoi]

✅ ACTION : [étapes concrètes et numérotées]

📈 RÉSULTAT : [amélioration attendue et métriques]

🎯 PRIORITÉ : 🔴 URGENT / 🟡 IMPORTANT / 🟢 OPTIONNEL
```

---

## 🐛 Troubleshooting

### Erreur 401 Unauthorized
→ Vérifier authentication token `/api/login/`

### Erreur "Aucune donnée disponible" (GSC)
→ Vérifier credentials GSC dans `.env`
→ Vérifier que GSC a indexé le site

### Gemini API Error
→ Vérifier `GEMINI_API_KEY` dans `.env`
→ Vérifier quota API Google

### Messages ne s'affichent pas
→ Vérifier network tab (F12)
→ Vérifier CORS settings
→ Vérifier backend running

---

## 📅 Prochaines Étapes

1. ✅ Backend API complète
2. ✅ Frontend composant Angular
3. ✅ Integration Gemini 2.5 Flash
4. ✅ Route dans sidebar
5. ⏳ Tests E2E (optional)
6. ⏳ Déploiement production (Vercel/Render)

---

## 📝 Notes importantes

- **Données réelles** : L'IA utilise vos vraies données GA & GSC
- **Langue française** : Toutes les réponses en français 🇫🇷
- **Format structuré** : Observations → Problème → Actions → Résultats
- **Détection fautes** : Signale les URLs mal orthographiées (ex: "/gta-detaail")
- **Anomalies** : Détecte automatiquement les chutes/pics de trafic

---

**Créé le :** 15 avril 2026
**Status :** ✅ Fonctionnel
**Version :** 1.0
