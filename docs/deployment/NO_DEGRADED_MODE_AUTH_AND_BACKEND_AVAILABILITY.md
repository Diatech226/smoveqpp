# NO DEGRADED MODE — AUTH + BACKEND AVAILABILITY

## Summary
- CMS degraded local mode is removed.
- API + MongoDB are the only source of truth.
- When backend/auth fails, CMS must show a blocking error (no local cache fallback as authoritative data).

## Auth/session flow
1. CMS boot: `GET /api/v1/auth/session` with credentials included.
2. If authenticated, load protected CMS endpoints.
3. If unauthenticated (`401`), redirect/show login.
4. After login success, refetch `/api/v1/auth/session`, then load CMS content.

## 401 vs 403
- `401`: `{ "error": "unauthenticated", "message": "Session required." }`
- `403`: `{ "error": "forbidden", "message": "CMS role required." }`

## CORS/session requirements
- Allowed origins: `https://smoovecms.vercel.app`, `https://www.smovecommunication.com`, localhost variants.
- Credentials enabled, no `*` wildcard, and `OPTIONS` enabled.
- Production cookie: `secure=true`, `sameSite=none`, `httpOnly=true`, trust proxy enabled.

## Render/Vercel env setup
- API: configure `API_ORIGIN`, `FRONTEND_ORIGINS`, `MONGO_URI`, `SESSION_SECRET`, `AUTH_STORAGE_MODE=mongo`, `SESSION_STORE_MODE=mongo`.
- CMS/site: configure `VITE_API_ORIGIN` + `VITE_API_BASE_URL=/api/v1`.

## Health checks
- `GET /api/v1/ready`
- `GET /api/v1/content/health-summary` (protected CMS role)

## Troubleshooting checklist
- Verify browser includes session cookie on cross-origin requests.
- Verify `FRONTEND_ORIGINS` exactly matches deployed origins.
- Confirm MongoDB connected and session store mode is mongo.
- Confirm logged-in user role is `admin|editor|author` for protected CMS content routes.
- If backend unavailable, stop edits and retry once API is back.
