# Auth env and role access

## Role model
- CMS roles allowed: `admin`, `editor`, `author`.
- Public roles: `client`, `viewer`, `user`.
- Public registration always creates non-admin roles using `DEFAULT_PUBLIC_ROLE` (`client` or `viewer`).

## Backend auth contract
- `GET /api/v1/auth/session`: returns 200 with `user` when authenticated, or 200 with `user: null` when unauthenticated.
- `POST /api/v1/auth/login`: email/password login, creates server session cookie, returns user with role.
- `POST /api/v1/auth/register`: enabled by `PUBLIC_REGISTRATION_ENABLED=true`, creates non-admin user.
- `POST /api/v1/auth/logout`: clears session.
- `GET /api/v1/auth/oauth/providers`: always returns email/password + provider availability flags.

## CORS and session cookie
- Set exact origins in `FRONTEND_ORIGINS` (site + CMS).
- API CORS uses credentials and exact origin reflection, no wildcard.
- Allowed local origins: localhost/127.0.0.1 on ports 5173 and 5174.
- Session cookie policy:
  - Production: `secure=true`, `sameSite=none`, trust proxy enabled.
  - Local dev: `secure=false`, `sameSite=lax`.

## Required env samples
Use the `.env.example` files in `api/`, `site/`, and `cms/` as deployment references.
