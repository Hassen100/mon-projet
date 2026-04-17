# Configuration Ollama sur Render

## Étape 1: Créer le service Ollama sur Render

1. Va sur [https://dashboard.render.com](https://dashboard.render.com)
2. Clique **+ New** → **Web Service**
3. Connecte ton repo GitHub `mon-projet`
4. Configura comme suit:

### Configuration du service Ollama:

| Paramètre | Valeur |
|-----------|--------|
| **Name** | `mon-projet-ollama` |
| **Environment** | `Docker` |
| **Repository** | `https://github.com/Hassen100/mon-projet.git` |
| **Branch** | `main` |
| **Dockerfile path** | `Dockerfile.ollama` (voir ci-dessous) |
| **Auto-deploy** | On |
| **Instance Type** | `Standard` (au minimum) |
| **Region** | `Frankfurt (eu-west-1)` (proche de toi) |

### Variables d'environnement:
```
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_MODEL=orca-mini
```

---

## Étape 2: Créer le Dockerfile pour Ollama

Crée un fichier `Dockerfile.ollama` à la racine du repo:

```dockerfile
FROM ollama/ollama:latest

# Expose port 11434 for API
EXPOSE 11434

# Set environment
ENV OLLAMA_HOST=0.0.0.0:11434

# Pull the model on startup
RUN ollama pull orca-mini

# Start Ollama server
CMD ["ollama", "serve"]
```

---

## Étape 3: Mettre à jour le backend Render

Une fois le service Ollama déployé, tu verras son URL (ex: `https://mon-projet-ollama.onrender.com`).

**Ajoute cette variable Render (backend service):**

```
OLLAMA_HOST=https://mon-projet-ollama.onrender.com
```

---

## Étape 4: Redéployer le backend

Render redéploiera automatiquement le backend avec la nouvelle variable d'env.

---

## Vérification

Une fois live, teste la connexion:

```bash
curl https://mon-projet-ollama.onrender.com/api/tags
```

Doit retourner une liste de modèles (dont `orca-mini`).

---

## Alternative rapide: Stub uniquement

Si tu ne veux pas d'Ollama distant maintenant:
- Le code fallback stub est **déjà activé**
- La prod affichera les messages de maintenance à la place des crashes
- Zéro coûts additionnels

**A toi de choisir!**
