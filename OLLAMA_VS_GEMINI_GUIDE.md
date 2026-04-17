# 🎓 Guide Complet : Ollama vs Gemini vs Fallback

## 📊 Comparaison Définitive

### **Mode 1 : Fallback Gratuit (ACTUEL - Default)**
```env
AI_USE_OLLAMA=false
AI_FORCE_FALLBACK=true
```
- ✅ Coût: $0/mois
- ✅ Modèle: Analyse locale déterministe
- ⚠️ Limitation: Même réponse pour toutes les questions
- ⚠️ Pas de conversation libre
- ✅ Vitesse: < 1s
- ✅ Pas de dépendances externes

**Exemple**:
```
Q: "Bonjour ça va ?"
A: "📊 OBSERVATION: 56 sessions..."

Q: "Dis moi une blague"
A: "📊 OBSERVATION: 56 sessions..."

⚠️ Toujours la même réponse !
```

---

### **Mode 2 : Ollama Gratuit Local (MEILLEUR) ⭐**
```env
AI_USE_OLLAMA=true
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=mistral
```

**Prérequis**:
1. Télécharger Ollama: https://ollama.ai
2. Lancer: `ollama serve`
3. Télécharger modèle: `ollama pull mistral`
4. Modifier `.env`: `AI_USE_OLLAMA=true`
5. Redémarrer backend

- ✅ Coût: $0/mois
- ✅ Conversation LIBRE (répond à toutes les questions)
- ✅ Contexte SEO intégré
- ✅ Illimité (pas de quota)
- ✅ Données locales (sécurisé)
- ✅ Fonctionne offline
- ⚠️ Vitesse: 2-5s (dépend du PC)
- ⚠️ Nécessite installation Ollama

**Exemple**:
```
Q: "Bonjour ça va ?"
A: "Salut! Je suis ton expert SEO. Comment je peux t'aider ?"

Q: "Dis moi une blague"
A: "Pourquoi les développeurs préfèrent le dark mode?
   Parce que la lumière attire les bugs! 🐛"

Q: "Analyse mon taux de rebond"
A: "📊 OBSERVATION: Taux rebond 30%..."

✅ Vraie conversation !
```

---

### **Mode 3 : Gemini Payant (Google Cloud)**
```env
AI_USE_OLLAMA=false
AI_FORCE_FALLBACK=false
```

- ❌ Coût: $0.075-$0.30 par 1000 tokens (~$1-5/mois)
- ✅ Conversation libre ✓
- ✅ Réponses de très haute qualité
- ⚠️ Quota limité: 50 req/jour gratuit, puis payant
- ⚠️ Rate limit: 15 req/min même en payant
- ❌ Données envoyées à Google
- ✅ Vitesse: < 1s
- ❌ Configuration complexe

---

## 🎯 Recommandation: Ollama (Meilleur Choix)

**Pourquoi Ollama pour ce projet ?**

✅ **Zéro coût** ($0/mois - aucune limite)  
✅ **Conversation libre** (répond à n'importe quoi)  
✅ **Sécurisé** (données locales)  
✅ **Illimité** (1000+ requêtes/jour)  
✅ **Qualité** (Mistral excellent français)  
✅ **Déployable** (sur n'importe quel serveur)  

---

## 🚀 Comment Activer Ollama ?

### **Étape 1 : Installer Ollama**
```powershell
# Windows
# Télécharge depuis https://ollama.ai et installe
```

### **Étape 2 : Lancer Ollama**
```powershell
ollama serve
# Écoute sur http://localhost:11434
```

### **Étape 3 : Télécharger le modèle**
```powershell
# Dans une NEW terminal
ollama pull mistral

# OU pour un modèle plus léger:
ollama pull llama2
```

### **Étape 4 : Configurer le backend**
```env
# backend/.env
AI_USE_OLLAMA=true
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=mistral
```

### **Étape 5 : Redémarrer Django**
```powershell
cd backend
python manage.py runserver
```

### **Étape 6 : Tester**
```powershell
# Ouvrir http://localhost:4200
# Login: admin/admin
# Aller à "AI Assistant"
# Envoyer n'importe quel message
# Ollama répond en 2-5s ✅
```

---

## 🧪 Test Rapide

```python
import requests

base = 'http://127.0.0.1:8000'

# Login
r = requests.post(base + '/api/login/', 
    json={'username': 'admin', 'password': 'admin'})
token = r.json()['token']
headers = {'Authorization': f'Token {token}'}

# Test conversation libre
messages = [
    'Bonjour',
    'Raconte moi une blague',
    'Quel est mon taux de rebond?',
]

for msg in messages:
    r = requests.post(base + '/api/ai/chat/',
        json={'message': msg, 'days': 30}, 
        headers=headers)
    print(f'Q: {msg}')
    print(f'A: {r.json()["response"][:100]}...\n')
```

---

## ⚖️ Tableau Récapitulatif

| Critère | Fallback | Ollama | Gemini Payant |
|---------|----------|--------|---------------|
| Coût | $0 | $0 | $1-5/mois |
| Conversation Libre | ❌ | ✅ | ✅ |
| Quota/Limites | Local only | ∞ Illimité | 15 req/min |
| Installation | ✅ Zéro | ✅ 1-click | ⚠️ Complex |
| Vitesse | < 1s | 2-5s | < 1s |
| Sécurité (données) | ✅ Local | ✅ Local | ❌ Google |
| Français | Moyen | ✅ Très bon | ✅ Excellent |
| Déployable | ✅ Tout | ✅ Tout | ❌ APIs only |

---

## 📝 Prochaines Étapes

**Pour tester Ollama:**
1. Télécharge Ollama (5 min)
2. Lance `ollama serve`
3. Télécharge le modèle: `ollama pull mistral` (2-3 min)
4. Change `.env`: `AI_USE_OLLAMA=true`
5. Redémarre backend
6. Teste dans le dashboard

**Temps total**: ~15-20 minutes

**Résultat**: Assistant IA avec conversation LIBRE, $0 de coût, illimité ! 🚀

---

**Tu veux que je t'aide avec l'installation ?** Dis-le et je te guide pas à pas ! 👨‍💻
