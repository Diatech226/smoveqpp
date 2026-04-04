# Vercel Single-App Deployment Guide

## Objective

Deploy public site, CMS, and API as **one Vercel project**.

## What changed

- Removed workspace package boundaries (`apps/site`, `apps/cms`, `apps/api` are folders, not standalone packages).
- Consolidated dependencies and scripts into root `package.json`.
- Build now outputs one static directory (`build`) containing both:
  - site at `/`
  - CMS at `/cms`
- API is exposed via root `api/index.js`, reusing `apps/api/server/app.js`.
- Root `.env.example` is the primary environment template.

## Vercel configuration

`vercel.json` uses:

- `installCommand`: `npm install`
- `buildCommand`: `npm run build`
- `outputDirectory`: `build`
- rewrites:
  - `/uploads/*` → `/api/uploads/*`
  - `/cms` and `/cms/*` → `/cms/index.html`
  - fallback `/*` → `/index.html`

## Production behavior

- Public site/blog routes remain hash-driven under root SPA.
- CMS is available from `/cms/#cms`.
- API endpoints remain under `/api/v1/*`.
- Media remains accessible through `/uploads/*` (rewritten to API function).

## Local validation checklist

```bash
npm install
npm run build
npm run test
```

Manual checks:

1. Open public site and verify home/blog/projects/services.
2. Open CMS and verify dashboard/blog/projects/media/users/settings flows.
3. Verify auth login/register/account screens.
4. Verify `/api/v1/health` returns 200.
5. Verify uploaded media resolves under `/uploads/...`.
