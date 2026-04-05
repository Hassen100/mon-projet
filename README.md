# Mon Projet

Projet full-stack compose de :

- `seo-dashboard/` : frontend Angular
- `backend/` : API Django

## Fonctionnalites

- connexion et inscription
- gestion d utilisateurs admin
- dashboard SEO
- page Django Admin
- page temporaire `create-admin/` pour creer un superuser en local

## Lancement en local

### Frontend

```bash
cd seo-dashboard
npm install
npm start
```

Frontend local :

```text
http://localhost:4200
```

### Backend

```bash
cd backend
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Backend local :

```text
http://127.0.0.1:8000
```

Admin Django :

```text
http://127.0.0.1:8000/admin/
```

Creation admin via navigateur :

```text
http://127.0.0.1:8000/create-admin/
```

## Deploiement

### Frontend sur Vercel

Le repo contient deja [vercel.json](C:\Users\VIP INFO\Desktop\mon-projet\vercel.json).

Avant le deploiement, remplace l URL backend de production dans [api-base.ts](C:\Users\VIP INFO\Desktop\mon-projet\seo-dashboard\src\app\api-base.ts) :

```ts
const productionApiBaseUrl = 'https://your-render-backend.onrender.com/api';
```

Puis Vercel utilisera automatiquement :

- `buildCommand`: `cd seo-dashboard && npm install && npm run build:static`
- `outputDirectory`: `seo-dashboard/dist/seo-dashboard/browser`

### Backend sur Render

Le repo contient deja [render.yaml](C:\Users\VIP INFO\Desktop\mon-projet\render.yaml).

Fichiers utiles :

- [backend/requirements.txt](C:\Users\VIP INFO\Desktop\mon-projet\backend\requirements.txt)
- [backend/runtime.txt](C:\Users\VIP INFO\Desktop\mon-projet\backend\runtime.txt)
- [backend/backend/settings.py](C:\Users\VIP INFO\Desktop\mon-projet\backend\backend\settings.py)

Variables a definir sur Render :

- `DJANGO_SECRET_KEY`
- `DATABASE_URL`
- `DJANGO_DEBUG=False`
- `DJANGO_ALLOWED_HOSTS=your-backend.onrender.com`
- `CORS_ALLOW_ALL_ORIGINS=False`
- `CORS_ALLOWED_ORIGINS=https://hassen100.github.io`
- `CSRF_TRUSTED_ORIGINS=https://your-backend.onrender.com`
- `ENABLE_CREATE_ADMIN_PAGE=False`

Important :

- en production, desactive la page `create-admin/`
- si ton frontend tourne sur GitHub Pages, l origine CORS reste `https://hassen100.github.io`

### GitHub Pages

Si tu veux publier seulement le frontend sur GitHub Pages, utilise :

```bash
cd seo-dashboard
npm install
npm run build:static
```

Le build statique prepare :

- `index.html`
- `404.html`

dans `seo-dashboard/dist/seo-dashboard/browser/`.

## Branches

- `main` : branche principale
- `deploy` : branche de deploiement que je peux maintenir separement
- `backup-old-main-2026-04-06` : sauvegarde de l ancien contenu GitHub

## Notes

- le backend utilise les variables d environnement pour le deploiement
- en local, la configuration actuelle reste compatible avec MySQL sur `127.0.0.1:3307`
- le frontend utilise `localhost` en local et l URL de production definie dans `api-base.ts` hors local
