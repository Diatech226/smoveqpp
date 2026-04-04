# Vercel Deployment Guide (Monorepo)

## Recommended project split

Create **three separate Vercel projects** from this repository:

1. **Site project**
   - Root Directory: `apps/site`
   - Build Command: `npm run build`
   - Output Directory: `build`
2. **CMS project**
   - Root Directory: `apps/cms`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **API project**
   - Root Directory: `apps/api`
   - Build Command: *(leave empty)*
   - Output Directory: *(leave empty)*
   - Runtime entry handled by `apps/api/vercel.json` (`api/index.js`)

> The API is a Node runtime and must **not** be configured with a static output directory like `dist`.

## Why the `No Output Directory named "dist"` failure happened

That failure occurs when a Vercel project is configured like a static frontend while pointing to a Node API root (or to monorepo root with mismatched build settings).

This repository now keeps app-level `vercel.json` files aligned to each app boundary:

- `apps/site/vercel.json` → Vite output `build`
- `apps/cms/vercel.json` → Vite output `dist`
- `apps/api/vercel.json` → Node function routes only (no output directory)

## Environment variables

### Site (`apps/site`)
- `VITE_API_BASE_URL` (e.g. `https://api.example.com/api/v1`)
- `VITE_API_ORIGIN`
- `VITE_CMS_APP_URL`
- `VITE_REQUEST_TIMEOUT_MS`

### CMS (`apps/cms`)
- `VITE_API_BASE_URL` (same API base as site)
- `VITE_API_ORIGIN`
- `VITE_PUBLIC_SITE_URL`

### API (`apps/api`)
- Core:
  - `API_ORIGIN`
  - `FRONTEND_ORIGIN`
  - `FRONTEND_ORIGINS` (include site + cms domains)
  - `SESSION_SECRET`
  - `MONGO_URI`, `MONGO_DB_NAME`
- Contact email delivery:
  - `CONTACT_TO_EMAIL`
  - `EMAIL_FROM`
  - **one provider path**:
    - Resend: `RESEND_API_KEY`
    - or SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`

## Contact form flow

Site form submit:

`POST {VITE_API_BASE_URL}/contact`

Backend route:

`/api/v1/contact` (also available at `/api/contact`)

Behavior:
- Validates payload (name/email/subject/message)
- Sends using Resend (preferred when configured), otherwise SMTP
- Returns meaningful errors for validation or provider failures
