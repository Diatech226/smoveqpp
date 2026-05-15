# Three-project Vercel architecture

## Final architecture
- site frontend (`site/`) -> API (`api/`)
- cms frontend (`cms/`) -> API (`api/`)
- api backend (`api/`) -> MongoDB

## Folder structure
- `site/`: independent Vite public frontend
- `cms/`: independent Vite CMS frontend
- `api/`: independent Express API backend
- ``: legacy monolith, now obsolete/deprecated

## Environment variables
Use `.env.example` in each folder:
- `site/.env.example`
- `cms/.env.example`
- `api/.env.example`

Domains:
- SITE_DOMAIN=https://smove-three.vercel.app
- API_DOMAIN=https://smoveapi-1.onrender.com
- CMS_DOMAIN=https://smoovecms.vercel.app

Known current domains:
- site: https://smove-three.vercel.app
- cms: https://smoovecms.vercel.app
- api: https://smove-api.vercel.app (placeholder until deployed)

## Vercel setup
### site
- Root Directory: `site`
- Build Command: `npm run build`
- Output Directory: `dist`

### cms
- Root Directory: `cms`
- Build Command: `npm run build`
- Output Directory: `dist`

### api
- Root Directory: `api`
- Vercel routes `/api/v1/*` -> `api/index.js`

## CORS/session requirements
- API allows exact origins from `FRONTEND_ORIGINS` + localhost dev origins.
- No wildcard origin for credentialed requests.
- Credentials enabled and preflight enabled.
- Cookies: production `secure=true`, `sameSite=none`; local `secure=false`, `sameSite=lax`.

## Deployment checklist
1. Set env vars in each Vercel project.
2. Deploy API first and verify:
   - `/api/v1/ready`
   - `/api/v1/content/public/events`
   - `/api/v1/auth/oauth/providers`
3. Deploy site and cms with `VITE_API_ORIGIN` set to API domain.
4. Verify site and cms API calls resolve to API domain.
