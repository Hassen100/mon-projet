# Correction: Clé API PageSpeed pour Projet 957640126032

## Problème
- La clé PageSpeed actuelle: `AIzaSyAN9juvTTpdH6KmIxafSml_44NX1SwHyOQ` 
- A épuisé son quota (25,000 requêtes/jour)
- Vous travaillez maintenant sur le projet `957640126032`, pas l'ancien projet
- PageSpeed ne marche ni en localhost ni en production

## Solution: Créer une nouvelle clé API

### Étape 1: Créer une clé API dans Google Cloud Console

1. Allez à: https://console.cloud.google.com/apis/credentials
2. **Sélectionnez le projet `957640126032`** (dropdown en haut)
3. Cliquez sur **+ Create Credentials** → **API Key**
4. Google génère une nouvelle clé (ex: `AIzaSyxxxxxxxxxxxxxxx`)
5. Cliquez sur la clé créée pour l'éditer
6. Sous "**API restrictions**":
   - Sélectionnez **"Restrict key"**
   - Cherchez et sélectionnez **"PageSpeed Insights API"** UNIQUEMENT
7. Cliquez **Save**
8. **Copiez la clé complète** (elle sera affichée en haut)

### Étape 2: Mettre à jour `.env` localement

Remplacez la ligne dans `backend/.env`:
```
PAGESPEED_API_KEY=AIzaSyAN9juvTTpdH6KmIxafSml_44NX1SwHyOQ
```

Par:
```
PAGESPEED_API_KEY=<VOTRE_NOUVELLE_CLE_ICI>
```

Ensuite testez localement sur http://localhost:4200

### Étape 3: Mettre à jour Render (production)

1. Allez à: https://dashboard.render.com
2. Sélectionnez votre service backend (`mon-projet-ve8t.onrender.com`)
3. Allez à **Environment** (dans le menu latéral)
4. Trouvez la variable `PAGESPEED_API_KEY`
5. Remplacez sa valeur par votre nouvelle clé
6. Cliquez **Save Changes**
7. Le service se redéploiera automatiquement (~2-3 minutes)

### Étape 4: Testez

- Attendez 5 minutes après le redéploiement Render
- Testez sur production: https://hassen100.github.io/mon-projet/#/pagespeed
- Entrez une URL et cliquez "Analyse"
- Vous devriez voir les résultats PageSpeed ou une erreur claire (pas d'attente infinie)

## Dépannage

**Si ça ne marche toujours pas:**
- Vérifiez que la facturation est ACTIVÉE sur le projet `957640126032` dans Google Cloud
- Vérifiez que l'API "PageSpeed Insights API" est bien ACTIVÉE (Enabled) pour ce projet
- Vérifiez que la clé a bien la restriction "PageSpeed Insights API only"

**Log Render:**
1. Allez à Dashboard Render
2. Sélectionnez le service backend
3. Allez à **Logs**
4. Cherchez `pagespeed` ou `quota` pour voir les erreurs exactes

## Crédits

Quota PageSpeed reset automatiquement à minuit UTC si vous préférez attendre.
