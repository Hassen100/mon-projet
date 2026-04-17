# Vérification: Authentification Google Cloud

## Pour vérifier que vous êtes connecté à Google Cloud CLI

Exécutez dans PowerShell:
```powershell
gcloud auth list
gcloud config get-value project
```

Si vous ne voyez pas le projet `957640126032`, connectez-vous:
```powershell
gcloud auth login
gcloud config set project 957640126032
```

## Pour lister les clés API existantes (optionnel)

```powershell
gcloud services api-keys list --project=957640126032
```

## Pour créer une clé API programmatiquement (optionnel)

```powershell
gcloud services api-keys create `
  --display-name="PageSpeed API Key" `
  --api-target="pagespeedonline.googleapis.com" `
  --project=957640126032
```

Mais c'est plus facile via Google Cloud Console Web.

## Vérifier que PageSpeed API est activée

```powershell
gcloud services list --enabled --project=957640126032 | Select-String "pagespeed"
```

Si PageSpeed n'apparait pas, activez-la:
```powershell
gcloud services enable pagespeedonline.googleapis.com --project=957640126032
```
