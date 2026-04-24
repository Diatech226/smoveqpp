# SMOVE API App (`apps/api`)

Express API used by both site and CMS.

## Local run

```bash
npm run dev -w @smove/api
```

Default URL: `http://127.0.0.1:3001`

## Build

No compile step is required for Node runtime:

```bash
npm run build -w @smove/api
```

## Environment variables

Copy template:

```bash
cp apps/api/.env.example apps/api/.env.local
```

Core variables:

- `API_ORIGIN`
- `FRONTEND_ORIGIN`
- `FRONTEND_ORIGINS` (must include site + cms domains in production)
- `SESSION_SECRET`
- `MONGO_URI`, `MONGO_DB_NAME`
- OAuth provider/client vars and callback URLs
- `CONTACT_TO_EMAIL`, `EMAIL_FROM`, provider credentials
- `MEDIA_*`, `CONTENT_SCHEMA_VERSION`

## Vercel

- Root Directory: `apps/api`
- Build Command: leave empty or keep default
- Output Directory: leave empty
- Runtime routes are defined in `apps/api/vercel.json` via `api/index.js`.
