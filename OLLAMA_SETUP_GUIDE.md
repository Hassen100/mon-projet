# 🔧 Installation & Configuration Ollama pour SEO Dashboard

## 📥 ÉTAPE 1 : Télécharger et Installer Ollama

### Sur Windows:
1. Va sur https://ollama.ai
2. Clique sur "Download for Windows"
3. Lance l'installateur (.exe)
4. Ollama se lance automatiquement en background

**Vérifier l'installation:**
```powershell
ollama --version
```

### Démarrer Ollama (si pas déjà lancé):
```powershell
ollama serve
```
Ollama écoute sur `http://localhost:11434`

---

## 📥 ÉTAPE 2 : Télécharger un Modèle

Ouvre une nouvelle terminal PowerShell et :

```powershell
# Télécharger Mistral (recommandé pour SEO - 7.3GB)
ollama pull mistral

# OU Llama 2 (7B - plus léger - 3.8GB)
ollama pull llama2

# OU Orca (très bon pour tâches spécialisées)
ollama pull orca-mini
```

**Vérifier les modèles installés:**
```powershell
ollama list
```

---

## 🐍 ÉTAPE 3 : Installation Python

Dans terminal PowerShell du backend :

```powershell
cd c:\Users\VIP INFO\Desktop\mon-projet\backend
pip install ollama requests
```

---

## 🔌 ÉTAPE 4 : Configuration Django

### Créer le service Ollama

Fichier: `backend/api/ollama_service.py`

```python
"""Service pour intégration Ollama - Modèles gratuits locaux"""
import os
import requests
import json
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from .models import GoogleAnalyticsData, GoogleSearchConsoleData
from .google_analytics_service import GoogleAnalyticsService


class OllamaService:
    """Service AI utilisant Ollama (gratuit, local, illimité)"""
    
    def __init__(self):
        self.base_url = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
        self.model = os.getenv('OLLAMA_MODEL', 'mistral')
        self.timeout = 60
    
    def _is_ollama_available(self) -> bool:
        """Vérifier que Ollama est accessible"""
        try:
            resp = requests.get(f'{self.base_url}/api/tags', timeout=2)
            return resp.status_code == 200
        except:
            return False
    
    def generate_response(self, prompt: str) -> str:
        """Générer une réponse avec Ollama"""
        if not self._is_ollama_available():
            raise RuntimeError(
                'Ollama not running. Start with: ollama serve'
            )
        
        try:
            payload = {
                'model': self.model,
                'prompt': prompt,
                'stream': False,
            }
            
            resp = requests.post(
                f'{self.base_url}/api/generate',
                json=payload,
                timeout=self.timeout
            )
            
            if resp.status_code == 200:
                data = resp.json()
                return data.get('response', '').strip()
            else:
                raise RuntimeError(f'Ollama error: HTTP {resp.status_code}')
                
        except requests.Timeout:
            raise RuntimeError(f'Ollama timeout (>{self.timeout}s)')
        except Exception as e:
            raise RuntimeError(f'Ollama error: {str(e)}')
    
    def get_dashboard_context(self, user: User, days: int = 30):
        """Récupère données SEO pour contexte"""
        from django.db.models import Sum, Avg, FloatField, Q
        from django.db.models.functions import Coalesce
        
        start_date = datetime.now().date() - timedelta(days=days)
        
        # Analytics
        ga_data = GoogleAnalyticsData.objects.filter(
            user=user, date__gte=start_date
        ).aggregate(
            sessions=Coalesce(Sum('sessions'), 0, output_field=FloatField()),
            users=Coalesce(Sum('active_users'), 0, output_field=FloatField()),
            views=Coalesce(Sum('screen_page_views'), 0, output_field=FloatField()),
        )
        
        # Search Console
        gsc_data = GoogleSearchConsoleData.objects.filter(
            user=user, date__gte=start_date
        ).aggregate(
            clicks=Coalesce(Sum('clicks'), 0, output_field=FloatField()),
            impressions=Coalesce(Sum('impressions'), 0, output_field=FloatField()),
            ctr=Coalesce(Avg('ctr'), 0.0, output_field=FloatField()),
            position=Coalesce(Avg('position'), 0.0, output_field=FloatField()),
        )
        
        return {
            'analytics': ga_data,
            'search_console': gsc_data,
            'period_days': days,
        }
    
    def analyze_seo_with_context(self, user: User, question: str, days: int = 30) -> str:
        """Analyse SEO avec contexte"""
        
        context = self.get_dashboard_context(user, days)
        
        system = """Tu es un expert SEO français. Analyse les données du dashboard et formule des recommandations.

Format réponse:
📊 OBSERVATION: [données observées]
⚠️  PROBLÈME: [ce qui ne va pas]
✅ ACTION: [étape concrète]
📈 RÉSULTAT: [amélioration attendue]

Sois direct, concis et actionnable."""

        prompt = f"""{system}

Données (derniers {days} jours):
- Sessions: {context['analytics']['sessions']}
- Utilisateurs: {context['analytics']['users']}
- Page views: {context['analytics']['views']}
- Clics SEO: {context['search_console']['clicks']}
- Impressions: {context['search_console']['impressions']}
- CTR: {context['search_console']['ctr']*100:.1f}%
- Position moyenne: {context['search_console']['position']:.1f}

Question: {question}

Réponds en français."""

        return self.generate_response(prompt)
    
    def get_quick_analysis(self, user: User, days: int = 30) -> str:
        """Analyse rapide 3-4 points clés"""
        context = self.get_dashboard_context(user, days)
        
        prompt = f"""Analyse rapide des données SEO, 3-4 points clés en français:

Sessions: {context['analytics']['sessions']}
Utilisateurs: {context['analytics']['users']}
Clics: {context['search_console']['clicks']}
Position: {context['search_console']['position']:.1f}

Format simple, bullet points."""

        return self.generate_response(prompt)
```

### Updater le .env

```env
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=mistral
AI_USE_OLLAMA=true
```

### Modifier views.py

Fichier: `backend/api/views.py`

Remplacer les imports :

```python
# À la place de:
from .gemini_seo_service import GeminiSEOService

# Utiliser:
from .ollama_service import OllamaService
```

Et dans les endpoints, utiliser OllamaService au lieu de GeminiSEOService.

---

## ✅ TEST

```powershell
# Terminal 1 : Démarrer Ollama
ollama serve

# Terminal 2 : Télécharger modèle
ollama pull mistral

# Terminal 3 : Backend
cd backend
python manage.py runserver

# Terminal 4 : Test
python -c "
import requests
r = requests.post('http://127.0.0.1:8000/api/login/', 
    json={'username':'admin', 'password':'admin'})
token = r.json()['token']
h = {'Authorization': f'Token {token}'}
r = requests.post('http://127.0.0.1:8000/api/ai/chat/',
    json={'message': 'hello', 'days': 30}, headers=h)
print(r.json()['response'][:200])
"
```

---

## 🎯 Avantages Ollama pour CE projet

✅ **Gratuit** : $0/mois  
✅ **Local** : Aucune donnée émise  
✅ **Rapide** : 1-2s sur PC normal  
✅ **Illimité** : Pas de quota  
✅ **Qualité** : Mistral excellent pour texte français  
✅ **Offline** : Fonctionne sans Internet  
✅ **Production** : Déployable sur serveur  

---

## 🚀 Commandes Utiles

```powershell
# Démarrer Ollama
ollama serve

# Télécharger modèle
ollama pull mistral

# Lancer modèle en CLI interactif
ollama run mistral

# Lister modèles installés
ollama list

# Supprimer un modèle
ollama rm mistral
```

---

**C'EST PRÊT ! 🎉 Tes données SEO vont enrichir les réponses IA locales !**
