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


## Authentication (Clerk-first)

Authentication is now Clerk-driven for both the public site and CMS:

- email/password sign-up and sign-in through Clerk
- Google OAuth (and additional social providers via Clerk strategies)
- backend API trusts Clerk JWT bearer tokens and syncs users into MongoDB using `clerkId`
- role/account-status authorization remains in the local `users` collection

### Required environment variables

Set Clerk keys in `.env.local`:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_ISSUER_URL` (for JWT issuer validation)
- optional: `CLERK_AUDIENCE`, `CLERK_WEBHOOK_SECRET`

### Local user sync model

The API syncs Clerk identities idempotently on authenticated requests (and optional webhook calls), using `clerkId` as canonical external identity. Existing role/status/admin fields are preserved in local DB and used for CMS access checks.
