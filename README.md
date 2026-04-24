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

Set these env vars in `.env.local` for production-like local development:

- `MONGO_URI`, `MONGO_DB_NAME`
- `AUTH_STORAGE_MODE=mongo`, `SESSION_STORE_MODE=mongo`
- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- optional: Facebook OAuth vars if needed.
