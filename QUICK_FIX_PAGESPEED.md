# URGENT: Mise à jour clé PageSpeed API

## Situation
- Clé actuelle: `AIzaSyAN9juvTTpdH6KmIxafSml_44NX1SwHyOQ` → **QUOTA ÉPUISÉ**
- Projet correct: `957640126032`
- Vous avez une clé API existante

## Procédure rapide

### Option 1: Vous avez la clé texte (recommandé)

1. Copiez la clé API PageSpeed complète (exemple: `AIzaSy...`)
2. Ouvrez PowerShell dans ce dossier
3. Exécutez:
   ```powershell
   python update_pagespeed_key.py AIzaSyVotreCleCompleteIci
   ```
4. Testez localement: `http://localhost:4200/#/pagespeed`
5. Ensuite allez sur Render dashboard et mettez à jour l'env var

### Option 2: Récupérer la clé de Google Cloud CLI

1. Ouvrez PowerShell
2. Exécutez:
   ```powershell
   .\get-pagespeed-key.ps1 -ProjectId 957640126032
   ```
3. Copiez la clé affichée
4. Exécutez:
   ```powershell
   python update_pagespeed_key.py <LA_CLE_COPIEE>
   ```

### Option 3: Copier-coller manuel

1. Sur Google Cloud Console, trouvez votre clé API
2. Cliquez dessus pour afficher la clé complète
3. Remplacez dans `backend/.env`:
   ```
   PAGESPEED_API_KEY=VOTRE_CLE_ICI
   ```
4. Testez: `http://localhost:4200/#/pagespeed`

## Vérification
Après l'update, testez avec:
```powershell
python update_pagespeed_key.py AIzaSyVotreCle
```
Le script va tester automatiquement si la clé fonctionne.

## Mise à jour Render (production)
1. Dashboard Render: https://dashboard.render.com
2. Select service backend (`mon-projet-ve8t.onrender.com`)
3. **Environment** → Update `PAGESPEED_API_KEY`
4. Save → Service redéploie auto (2-3 min)
5. Testez: https://hassen100.github.io/mon-projet/#/pagespeed

## Questions?
- **La clé ne fonctionne pas?** → Vérifiez la facturation Google Cloud
- **Toujours quota exceeded?** → Créez une nouvelle clé sur Google Cloud Console
- **Localhost toujours cassé?** → Redémarrez le backend Django: `python backend/manage.py runserver`
