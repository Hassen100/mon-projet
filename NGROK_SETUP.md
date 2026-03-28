# 🚀 Solution ngrok pour Mode Réel

## Problème
Vercel (https://mon-projet123.vercel.app) ne peut pas accéder au backend local (http://127.0.0.1:8000)

## Solution : ngrok
ngrok crée un tunnel HTTPS public vers votre backend local

### Étape 1 : Installer ngrok
```bash
# Téléchargez ngrok depuis https://ngrok.com/download
# Ou avec Chocolatey :
choco install ngrok
```

### Étape 2 : Démarrer ngrok
```bash
ngrok http 8000
```

### Étape 3 : Copier l'URL ngrok
ngrok vous donnera une URL comme :
```
https://abc123.ngrok.io -> http://localhost:8000
```

### Étape 4 : Mettre à jour l'URL dans Angular
Dans `src/app/services/analytics.service.ts` :
```typescript
private baseUrl = 'https://abc123.ngrok.io/api/analytics';
```

### Étape 5 : Déployer
```bash
vercel --prod
```

## Résultat
- ✅ Vercel peut accéder au backend via ngrok
- ✅ Données Google Analytics réelles
- ✅ Plus de mode démo

## Alternative rapide
Utilisez le dashboard en local : http://localhost:4200
