# SMOVE CMS App (`apps/cms`)

Standalone CMS/admin frontend (Vite + React), detached from site internals.

## Local run

```bash
npm run dev -w @smove/cms
```

Default URL: `http://127.0.0.1:5174/#cms`

## Build

```bash
npm run build -w @smove/cms
```

Output directory: `apps/cms/dist`

## Environment variables

Copy template:

```bash
cp apps/cms/.env.example apps/cms/.env.local
```

Main vars:

- `VITE_API_BASE_URL`: API base route consumed by CMS.
- `VITE_API_ORIGIN`: API origin used by CMS Vite proxy.
- `VITE_PUBLIC_SITE_URL`: public site URL for all "Retour au site" links.
- `VITE_PUBLIC_APP_URL`: legacy fallback retained for backward compatibility.
- `VITE_CMS_PORT`: local CMS dev port.

## "Retour au site" resolution order

1. `VITE_PUBLIC_SITE_URL`
2. `VITE_PUBLIC_APP_URL` (legacy fallback)
3. inferred URL from CMS hostname (e.g. `cms.example.com` -> `example.com/#home`)
4. dev fallback `http://127.0.0.1:5173/#home`

## Vercel

- Root Directory: `apps/cms`
- Build Command: `npm run build`
- Output Directory: `dist`
