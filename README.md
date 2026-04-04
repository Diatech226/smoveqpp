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
cp .env.example .env.local
```

The root `.env.local` is now the primary source for site, CMS, and API runtime values.

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
