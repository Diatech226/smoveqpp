# Vercel Deployment Guide (Current Production Architecture)

## Production project split

Deploy this repository as **two Vercel projects**:

1. **Site + API project**
   - Domain: `https://smove-three.vercel.app`
   - Contains: public site frontend + backend API
   - API base: `https://smove-three.vercel.app/api/v1`
2. **CMS project**
   - Domain: `https://smoovecms.vercel.app`
   - Contains: CMS frontend only
   - Consumes API from: `https://smove-three.vercel.app/api/v1`

## Environment variable mapping

### Site + API (`site-api/.env.example`)
- `VITE_API_BASE_URL=/api/v1`
- `VITE_API_ORIGIN=https://smove-three.vercel.app`
- `VITE_PUBLIC_SITE_URL=https://smove-three.vercel.app`
- `VITE_CMS_APP_URL=https://smoovecms.vercel.app/#cms`
- `API_ORIGIN=https://smove-three.vercel.app`
- `FRONTEND_ORIGINS=https://smove-three.vercel.app,https://smoovecms.vercel.app`

### CMS (`cms/.env.example`)
- `VITE_API_BASE_URL=https://smove-three.vercel.app/api/v1`
- `VITE_API_ORIGIN=https://smove-three.vercel.app`
- `VITE_PUBLIC_SITE_URL=https://smove-three.vercel.app`
- `VITE_CMS_APP_URL=https://smoovecms.vercel.app/#cms`

## CORS requirements

Set backend `FRONTEND_ORIGINS` to include both production origins:

`https://smove-three.vercel.app,https://smoovecms.vercel.app`

This allows authenticated CMS and site requests against the shared API while keeping a strict allow-list.
