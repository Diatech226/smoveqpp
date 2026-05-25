# AUTH / ENV / CORS Configuration (Site + CMS + API)

## Architecture finale

- **Site public (Vercel)**: `https://www.smovecommunication.com`
- **CMS (Vercel)**: `https://smoovecms.vercel.app`
- **API (Render)**: `https://smoveapi-1.onrender.com`

Tous les flux d'auth passent par l'API:
- Site → API: `https://smoveapi-1.onrender.com/api/v1`
- CMS → API: `https://smoveapi-1.onrender.com/api/v1`

## Variables d'environnement attendues

### Render (API)

Renseigner les variables suivant `api/.env.example`:
- `NODE_ENV=production`
- `API_ORIGIN=https://smoveapi-1.onrender.com`
- `FRONTEND_ORIGIN=https://www.smovecommunication.com`
- `FRONTEND_ORIGINS=https://www.smovecommunication.com,https://smoovecms.vercel.app`
- `AUTH_STORAGE_MODE=mongo`
- `SESSION_STORE_MODE=mongo`
- `SESSION_SECRET=<secret fort >= 32 chars>`
- `MONGO_URI=<mongo uri>`
- `MONGO_DB_NAME=smoveqpp`
- `SESSION_TTL_SECONDS=86400`
- `ENABLE_EMAIL_PASSWORD_AUTH=true`
- `ENABLE_GOOGLE_LOGIN=false`
- `ENABLE_FACEBOOK_LOGIN=false`

### Vercel (site)

Renseigner les variables suivant `site/.env.example`:
- `VITE_API_ORIGIN=https://smoveapi-1.onrender.com`
- `VITE_API_BASE_URL=/api/v1`
- `VITE_PUBLIC_SITE_URL=https://www.smovecommunication.com`
- `VITE_CMS_APP_URL=https://smoovecms.vercel.app/#cms`
- `VITE_REQUEST_TIMEOUT_MS=10000`
- `VITE_ENABLE_EMAIL_PASSWORD_AUTH=true`
- `VITE_ENABLE_GOOGLE_LOGIN=false`
- `VITE_ENABLE_FACEBOOK_LOGIN=false`

### Vercel (CMS)

Renseigner les variables suivant `cms/.env.example`:
- `VITE_API_ORIGIN=https://smoveapi-1.onrender.com`
- `VITE_API_BASE_URL=/api/v1`
- `VITE_PUBLIC_SITE_URL=https://www.smovecommunication.com`
- `VITE_CMS_APP_URL=https://smoovecms.vercel.app/#cms`
- `VITE_REQUEST_TIMEOUT_MS=10000`
- `VITE_ENABLE_CMS=true`
- `VITE_ENABLE_REGISTRATION=true`
- `VITE_ENABLE_EMAIL_PASSWORD_AUTH=true`
- `VITE_ENABLE_GOOGLE_LOGIN=false`
- `VITE_ENABLE_FACEBOOK_LOGIN=false`
- `VITE_ENABLE_DEV_ADMIN=false`



### Vérification Vercel CMS (obligatoire)

Dans le projet **Vercel CMS**, vérifier exactement ces variables:
- `VITE_API_ORIGIN=https://smoveapi-1.onrender.com`
- `VITE_API_BASE_URL=/api/v1`
- `VITE_PUBLIC_SITE_URL=https://www.smovecommunication.com`
- `VITE_CMS_APP_URL=https://smoovecms.vercel.app/#cms`

Après toute modification de ces variables:
1. Redéployer le projet CMS.
2. Cocher l’option de **clear build cache** avant le déploiement.

## Règles CORS API

L'API doit autoriser uniquement:
- `https://www.smovecommunication.com`
- `https://smoovecms.vercel.app`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:5174`

Comportement:
- pas de `Access-Control-Allow-Origin: *`
- retour de l'origin exact autorisé
- `credentials: true`
- `Access-Control-Allow-Credentials: true`
- `OPTIONS` supporté
- headers autorisés:
  - `Content-Type`
  - `Authorization`
  - `X-CSRF-Token`
  - `Cache-Control`
  - `Pragma`
  - `Expires`

## Cookies / sessions

Session cookie:
- **Production**: `secure=true`, `sameSite=none`
- **Local**: `secure=false`, `sameSite=lax`

Render / proxy:
- `app.set('trust proxy', 1)` activé côté API.

## Endpoints auth utilisés par site + CMS

- `GET /api/v1/auth/session`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/register`
- `GET /api/v1/auth/oauth/providers`

Quand Google/Facebook sont désactivés, la réponse fonctionnelle est:

```json
{
  "emailPassword": true,
  "google": false,
  "facebook": false
}
```

## Checklist de test connexion

1. API ready:
   - `GET https://smoveapi-1.onrender.com/api/v1/ready` retourne `200`.
2. Providers:
   - `GET https://smoveapi-1.onrender.com/api/v1/auth/oauth/providers` retourne `200`.
3. Site:
   - login OK
   - session persistée
   - logout OK
   - pas d'erreur CORS en console
4. CMS:
   - login OK
   - restore session OK
   - accès dashboard admin OK
   - pas d'erreur CORS en console
