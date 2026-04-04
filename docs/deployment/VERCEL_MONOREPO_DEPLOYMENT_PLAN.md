# Vercel Monorepo Deployment Plan

## Final app boundaries

Shared package:
- `packages/shared` -> shared domain contracts (`contentSchemas`, `contentContracts`) consumed by site and CMS.

- **Site**: `apps/site`
  - Public marketing pages + blog rendering.
  - Reads API via `VITE_API_BASE_URL` / `VITE_API_ORIGIN`.
- **CMS**: `apps/cms`
  - Admin/editor application.
  - No runtime imports from site internals.
  - “Back to site” target controlled by `VITE_PUBLIC_SITE_URL`.
- **API**: `apps/api`
  - Express app in `apps/api/server`.
  - Vercel adapter function in `apps/api/api/index.js`.

## Vercel project mapping

### 1) `www.domain.com` (site)
- Root Directory: `apps/site`
- Build Command: `npm run build`
- Output Directory: `build`
- Install Command: `npm install`
- Domain: `www.domain.com`

### 2) `cms.domain.com` (cms)
- Root Directory: `apps/cms`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Domain: `cms.domain.com`

### 3) `api.domain.com` (api)
- Root Directory: `apps/api`
- Build Command: _none required_ (Vercel Node builder)
- Runtime entry: `api/index.js`
- Domain: `api.domain.com`

## Environment variables by app

### Site (`apps/site`)
- `VITE_API_BASE_URL`
- `VITE_API_ORIGIN`
- `VITE_CMS_APP_URL`
- `VITE_ENABLE_CMS`
- `VITE_ENABLE_REGISTRATION`

### CMS (`apps/cms`)
- `VITE_API_BASE_URL`
- `VITE_API_ORIGIN`
- `VITE_PUBLIC_SITE_URL`
- `VITE_PUBLIC_APP_URL` (legacy fallback)
- `VITE_CMS_PORT` (local only)

### API (`apps/api`)
- `API_PORT` (local only)
- `API_ORIGIN`
- `FRONTEND_ORIGIN`
- `FRONTEND_ORIGINS`
- `SESSION_SECRET`
- `AUTH_STORAGE_MODE`
- `SESSION_STORE_MODE`
- `MONGO_URI`, `MONGO_DB_NAME`
- OAuth credentials + callback URLs
- Media/content env vars (`MEDIA_*`, `CONTENT_SCHEMA_VERSION`)

## OAuth/subdomain guidance

When deploying with separate subdomains:

- Set API callbacks to API domain, e.g.:
  - `https://api.domain.com/api/v1/auth/oauth/google/callback`
  - `https://api.domain.com/api/v1/auth/oauth/facebook/callback`
- Ensure `FRONTEND_ORIGINS` includes both:
  - `https://www.domain.com`
  - `https://cms.domain.com`

## Local validation checklist

- `npm run dev:site`
- `npm run dev:cms`
- `npm run dev:api`
- `npm run build:site`
- `npm run build:cms`
- `npm run build:api`

## Operational storage paths

- Content JSON: `apps/api/server/data/content.json`
- Audit log JSON: `apps/api/server/data/audit-log.json`
- Uploads: `apps/api/server/data/uploads`
- Backup helper scripts are aligned to these paths.
