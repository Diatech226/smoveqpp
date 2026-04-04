# SMOVE Site App (`apps/site`)

Public site + blog frontend (Vite + React).

## Local run

```bash
npm run dev -w @smove/site
```

Default URL: `http://127.0.0.1:5173`

## Build

```bash
npm run build -w @smove/site
```

Output directory: `apps/site/build`

## Environment variables

Copy template:

```bash
cp apps/site/.env.example apps/site/.env.local
```

Main vars:

- `VITE_API_BASE_URL`: API base route used by the site.
- `VITE_API_ORIGIN`: API origin used by Vite proxy in local dev.
- `VITE_PUBLIC_SITE_URL`: canonical public site URL.
- `VITE_CMS_APP_URL`: standalone CMS URL.
- `VITE_REQUEST_TIMEOUT_MS`: API timeout override.

## Vercel

- Root Directory: `apps/site`
- Build Command: `npm run build`
- Output Directory: `build`
