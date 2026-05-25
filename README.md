# SMOVE Single-App Deployment

This repository is now consolidated as **one deployable application** for Vercel:

- public site (including blog)
- CMS/admin frontend
- API/server (Express, deployed as Vercel Function)

## Runtime layout

```text
apps/
  site/     # Public SPA build output at / and hash routes
  cms/      # CMS SPA build output at /cms
  api/      # Express server logic used by /api function
api/
  index.js  # Vercel function entrypoint (single deployment)
build/
  index.html
  assets/*
  cms/index.html
  cms/assets/*
```

## Commands (single root package)

## Monorepo workspace workflow

This repository uses **npm workspaces** with three apps:

- `site`
- `cms`
- `api`

Use a single install at the repo root (`npm install`) and a single unified dev command:

```bash
npm run dev
```

This starts API first, waits for `/api/v1/ready`, then starts site + CMS to avoid race conditions and degraded local fallback mode.


```bash
npm install
npm run dev        # site + cms + api together
npm run build      # builds site + cms for one output directory
npm run test
```

Useful targeted commands:

```bash
npm run dev:site
npm run dev:cms
npm run dev:api
npm run build:site
npm run build:cms
npm run start:api
```

## Local URLs

- Public site: `http://127.0.0.1:5173`
- CMS: `http://127.0.0.1:5174/#cms` (served at `/cms` in production)
- API: `http://127.0.0.1:3001`

## Environment setup


Current production domains:
- Site: `https://smove-three.vercel.app`
- CMS: `https://smoovecms.vercel.app`

Current production API endpoint:
- API base URL for both frontends: `https://smoveapi-1.onrender.com/api/v1`

Use `FRONTEND_ORIGINS=https://smove-three.vercel.app,https://smoovecms.vercel.app` so CORS allows both frontends.
For credentialed requests, the API returns the exact request origin (never `*`) and includes `Access-Control-Allow-Credentials: true`.

Use only the root env template:

```bash
cp .env.example .env
```

The root `.env` is the primary source for site, CMS, and API runtime values.

## Single-project Vercel deployment

- Root Directory: repository root
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `build`

Vercel serves:
- site SPA from `/index.html`
- CMS SPA from `/cms/index.html`
- API from `/api/index.js`

See: `docs/deployment/VERCEL_SINGLE_APP_DEPLOYMENT.md`.


## Authentication (MongoDB + backend session)

Authentication now uses one canonical backend model for both site and CMS:

- MongoDB-backed users (Mongoose)
- cookie-backed backend sessions (`express-session`)
- local email/password register + login
- backend OAuth for Google/Facebook linked into the same user record

OAuth login flow:
1. Frontend redirects to `/api/v1/auth/oauth/:provider/start`.
2. Backend exchanges provider code, verifies identity server-side, and links/creates user in MongoDB.
3. Backend creates the same session cookie model used by local login.

Set these env vars in `.env` (copy from `.env.example`) for this production architecture:

- `MONGO_URI`, `MONGO_DB_NAME`
- `AUTH_STORAGE_MODE=mongo`, `SESSION_STORE_MODE=mongo`
- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- optional: Facebook OAuth vars if needed.

## CMS ↔ API authentication configuration

### CMS (frontend)
Required variables:
- `VITE_API_URL=https://smoveapi-1.onrender.com/api/v1`
- `VITE_APP_NAME=Smove CMS`
- `VITE_PUBLIC_SITE_URL=https://smove-three.vercel.app`

The CMS API client centralizes every request and automatically adds `Authorization: Bearer <token>` when a token is available, while keeping session cookies enabled for compatibility.

### API (backend)
Required variables:
- `NODE_ENV=development`
- `PORT=5000`
- `MONGODB_URI=`
- `JWT_SECRET=`
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://smoovecms.vercel.app,https://smove-three.vercel.app`

### Local and production checks
1. Start API + CMS.
2. Login from CMS admin page.
3. Call `/api/v1/auth/session` (or `/api/v1/auth/me` if enabled) and verify authenticated user.
4. Open a protected CMS route (`/#cms` dashboard); verify access is granted.
5. Logout and verify protected route redirects to login.
6. Remove token/session and verify 401 message: "Session expirée ou token manquant".
7. Verify Vercel CMS env includes `VITE_API_URL=https://smoveapi-1.onrender.com/api/v1`.
8. Verify Render API env includes full `CORS_ORIGINS` list above.
