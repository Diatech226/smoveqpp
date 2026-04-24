# SMOVE Site App (`apps/site`)

Public site + blog frontend (Vite + React).

## Local run

Use the root scripts (single package.json):

```bash
npm run dev:site
```

Default URL: `http://127.0.0.1:5173`

## Build

```bash
npm run build:site
```

Output directory: `build` (shared root output, site at `/`).

## Environment variables

Use the root env file only:

```bash
cp .env.example .env
```

Main vars:

- `VITE_API_BASE_URL`: API base route used by the site.
- `VITE_API_ORIGIN`: API origin used by Vite proxy in local dev.
- `VITE_PUBLIC_SITE_URL`: canonical public site URL.
- `VITE_CMS_APP_URL`: CMS URL.
- `VITE_REQUEST_TIMEOUT_MS`: API timeout override.
