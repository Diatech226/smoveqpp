# Auth: Site + CMS session and password reset

## Architecture
- Single API auth backend at `/api/v1/auth` for both public site and CMS.
- Session cookie (`smove.sid`) is authoritative; both apps call `GET /auth/session` with `credentials: include`.
- CMS access roles: `admin`, `editor`, `author`.

## Public site behavior
- Email/password login and register stay on public site flows.
- Admin users are no longer auto-redirected to CMS after login; default route is account dashboard.
- Account page exposes a clear **Accéder au CMS** button only when role is CMS-authorized.

## Forgot/reset password flow
- `POST /api/v1/auth/forgot-password` (alias of existing `/password-reset/request`) validates input and creates secure reset token.
- Token is hashed at rest with expiry (`30 minutes` default).
- `POST /api/v1/auth/reset-password` (alias of existing `/password-reset/confirm`) validates token, expiry, updates password hash, clears reset token fields.
- If email delivery is not configured, API now returns `503 EMAIL_DELIVERY_NOT_CONFIGURED` (no fake success).
- If provider delivery fails, API returns `502 EMAIL_DELIVERY_FAILED`.

## Session/CORS/Cookies
- Cross-site site↔CMS requires `credentials: include` on frontend calls.
- Production cookie constraints: `secure: true`, `sameSite: none`.
- CORS must use explicit allowlist (`FRONTEND_ORIGINS`) with `credentials: true`.

## Environment variables
Backend/site:
- `PUBLIC_SITE_URL`
- `FRONTEND_ORIGIN`
- `FRONTEND_ORIGINS`
- `API_ORIGIN`
- `CMS_APP_URL`
- `EMAIL_FROM`
- `CONTACT_TO_EMAIL`
- `RESEND_API_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`

CMS:
- `VITE_API_ORIGIN`
- `VITE_API_BASE_URL`
- `VITE_PUBLIC_SITE_URL`
- `VITE_CMS_APP_URL`
