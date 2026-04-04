# SMOVE Monorepo

This repository is now organized as a **Vercel-ready monorepo** with isolated deployable apps:

- `apps/site` → public website (includes blog)
- `apps/cms` → standalone CMS/admin frontend
- `apps/api` → Express API/server

## Workspace structure

```text
apps/
  site/   # public app (Vite + React)
  cms/    # CMS app (Vite + React)
  api/    # Express server + Vercel function adapter
scripts/  # repo-level ops/dev scripts
docs/     # architecture and deployment docs
```

## Local development

1. Install dependencies for all workspaces:

```bash
npm install
```

2. Configure env files:

```bash
cp .env.example .env.local
cp apps/site/.env.example apps/site/.env.local
cp apps/cms/.env.example apps/cms/.env.local
cp apps/api/.env.example apps/api/.env.local
```

3. Run all apps together:

```bash
npm run dev
```

App URLs (local):
- Site: `http://127.0.0.1:5173`
- CMS: `http://127.0.0.1:5174/#cms`
- API: `http://127.0.0.1:3001`

## Per-app commands

```bash
npm run dev:site
npm run dev:cms
npm run dev:api

npm run build:site
npm run build:cms
npm run build:api
```

## Vercel multi-project mapping

- Vercel Project 1 (public): Root Directory = `apps/site`
- Vercel Project 2 (cms): Root Directory = `apps/cms`
- Vercel Project 3 (api): Root Directory = `apps/api`

Detailed setup guide: `docs/deployment/VERCEL_MONOREPO_DEPLOYMENT_PLAN.md`.

## Notes

- Site and CMS are now structurally isolated and independently deployable.
- API persistence paths are anchored under `apps/api/server/data`.
- CMS “Back to site” link uses configurable `VITE_PUBLIC_SITE_URL`.
