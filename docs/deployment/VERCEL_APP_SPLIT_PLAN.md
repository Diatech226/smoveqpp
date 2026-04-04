# Vercel App Split Plan (Site / CMS / API)

## Target split

- `apps/site`: public website + blog.
- `apps/cms`: standalone CMS/admin app.
- `apps/api`: backend API for both frontends.
- `packages/shared`: only shared contracts/types/helpers.

## Boundary rules

- Site must not import CMS internals.
- CMS must not import site internals.
- Shared package contains contracts and pure helpers only.
- API is independently deployable and does not depend on frontend source files.

## Vercel projects

### Project 1 — Site
- Root Directory: `apps/site`
- Framework preset: Vite
- Build Command: `npm run build`
- Output Directory: `build`

### Project 2 — CMS
- Root Directory: `apps/cms`
- Framework preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

### Project 3 — API
- Root Directory: `apps/api`
- Framework preset: Other / Node
- Build Command: optional (not required)
- Output Directory: none
- Runtime routing: `apps/api/vercel.json` (`api/index.js`)

## Environment variable ownership

### Site (`apps/site/.env*`)
- `VITE_API_BASE_URL`
- `VITE_API_ORIGIN`
- `VITE_PUBLIC_SITE_URL`
- `VITE_CMS_APP_URL`
- `VITE_REQUEST_TIMEOUT_MS`

### CMS (`apps/cms/.env*`)
- `VITE_API_BASE_URL`
- `VITE_API_ORIGIN`
- `VITE_PUBLIC_SITE_URL`
- `VITE_PUBLIC_APP_URL` (legacy fallback)
- `VITE_CMS_PORT` (local)

### API (`apps/api/.env*`)
- `API_ORIGIN`, `API_PORT`
- `FRONTEND_ORIGIN`, `FRONTEND_ORIGINS`
- `SESSION_SECRET`, auth/session storage vars
- `MONGO_URI`, `MONGO_DB_NAME`
- OAuth secrets + callback URLs
- email/contact vars
- media/content vars
- `USE_WORKSPACE_ENV_FALLBACK` (optional local compatibility only)

## Redirect and URL assumptions after split

- CMS “Retour au site” resolves from `VITE_PUBLIC_SITE_URL` first.
- OAuth callback URLs should target API domain (`api.example.com`).
- API CORS allow-list must include both site and CMS domains.
- Site and CMS should both target the same API base path (`/api/v1` or full API domain URL).

## Validation checklist

- `npm run build -w @smove/site`
- `npm run build -w @smove/cms`
- `npm run build -w @smove/api`
- Verify CMS has no imports from `apps/site`.
- Verify blog routes remain under site app.
