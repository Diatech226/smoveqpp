# SMOVE Web App

SMOVE is a React + Express web application that combines:
- a public marketing site,
- a public blog rendering path,
- and an authenticated CMS/admin workspace for editorial/content operations.

The codebase currently targets **pre-production maturity**: architecture and security baselines are in place, but several durability and operational gaps remain before production release.

## Main capabilities

### Public site
- Hash-based navigation for home, services, projects, portfolio, blog, and about pages.
- Animated marketing pages and reusable shell components.

### Authentication and account
- Session-based auth (cookie + CSRF token).
- Local login/register flows.
- OAuth login API wiring for Google/Facebook (provider credentials required).
- Email verification API + account page actions (resend/verify token).
- Account page with role/status/provider/verification visibility.

### CMS/admin workspace
- CMS access for `admin`, `editor`, `author` roles.
- CMS now has a dedicated app-like shell under `#cms` (with section hashes like `#cms/blog`) to separate admin workflows from the public browsing flow.
- Sections in dashboard: overview, projects, blog, media, page content, users, settings.
- Role-aware editorial actions (e.g., publish restrictions for author role).
- Admin user management and auth audit-event visibility.

### Blog/content path
- Public blog page renders canonicalized **published** posts.
- Backend supports blog status lifecycle (`draft`, `in_review`, `published`, `archived`) and editorial analytics.
- CMS blog/projects/page-content/settings flows now use backend-first persistence with explicit retry/failure states; local fallback is retained only as a compatibility path when backend is unavailable.

## Current stack

### Frontend
- React 18 + Vite + TypeScript
- Motion (`motion/react`) for animation
- Lucide icons + utility components
- Hash routing with custom resolver/guards (`src/app-routing`)

### Backend
- Node.js + Express
- Session auth with `express-session` + Mongo-backed production store (`connect-mongo`)
- CSRF middleware and auth rate limiting
- RBAC permission model (`admin`, `editor`, `author`, `viewer`, `client`)
- Helmet + CORS + cookie parsing

### Data/persistence
- Auth repository supports MongoDB or in-memory fallback.
- Content API uses a file-backed repository (`server/data/content.json`) for blog, projects, media metadata, page content, and CMS settings with schema-versioned migration normalization (`schemaVersion`, `migrationHistory`).
- Auth/content audit events are durably persisted in `server/data/audit-log.json` and available via admin audit endpoints.
- Media uploads now support backend persistence to local disk (`server/data/uploads`) via `/api/v1/content/media/upload` with MIME/size validation.
- Frontend repositories remain available for controlled fallback/compatibility when backend is unavailable.

### Testing/automation
- Vitest unit/integration tests (frontend + selected server modules)
- Playwright real-browser critical-flow suite (`tests/e2e/critical-flows.spec.ts`)
- Node smoke script for auth flow (`scripts/test-auth-smoke.js`)
- GitHub Actions quality/security workflows

## Local development

### 1) Install
```bash
npm install
```

### 2) Configure environment
```bash
cp .env.example .env.local
```

### 3) Run app (frontend + backend)
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### Alternative run commands
```bash
npm run dev:client
npm run dev:server
```

## Auth behavior locally

- The frontend bootstraps auth state from `GET /api/v1/auth/session`.
- CSRF token from session payload is sent on state-changing auth requests.
- CMS route access is guarded by both frontend checks and backend RBAC.
- In development, `AUTH_STORAGE_MODE=auto` can fall back to memory for local workflows.
- In production, startup now fails fast unless auth and session store are explicitly Mongo-backed.

## MongoDB requirements and seeding

- `AUTH_STORAGE_MODE` controls user repository strategy:
  - `mongo`: require MongoDB connection.
  - `auto`: use MongoDB when available; otherwise fallback in development only.
  - `memory`: always in-memory (non-persistent, dev only).
- `SESSION_STORE_MODE` controls `express-session` storage:
  - `mongo`: require Mongo session store (`connect-mongo`).
  - `auto`: use Mongo store when available; otherwise fallback in development only.
  - `memory`: in-memory session store (non-persistent, dev only).
- Optional admin seeding on startup:
  - `SEED_ADMIN_ON_START=true`
  - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`

## Environment variables (important)

### Frontend
- `VITE_API_BASE_URL` (default `/api/v1`)
- `VITE_REQUEST_TIMEOUT_MS`
- `VITE_ENABLE_CMS`
- `VITE_ENABLE_REGISTRATION`

### Backend core
- `API_PORT`
- `FRONTEND_ORIGIN`
- `API_ORIGIN`
- `SESSION_SECRET` (**must be strong in production**)

### Auth/session/security
- `AUTH_STORAGE_MODE`
- `SESSION_TTL_SECONDS`
- `PASSWORD_HASH_ROUNDS`
- `AUTH_RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `PUBLIC_REGISTRATION_ENABLED`

### MongoDB
- `MONGO_URI`
- `MONGO_DB_NAME`

### Content/media durability
- `CONTENT_SCHEMA_VERSION`
- `MEDIA_UPLOAD_DIR`
- `MEDIA_PUBLIC_BASE_PATH`
- `MEDIA_MAX_UPLOAD_BYTES`
- `MEDIA_ALLOWED_MIME_TYPES`


### OAuth
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL`
- `OAUTH_DEFAULT_ROLE`

### Email
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `EMAIL_FROM`
- `APP_BASE_URL`


## Operational readiness endpoints

- `GET /api/v1/health` — liveness signal for process availability.
- `GET /api/v1/ready` — readiness signal including Mongo connectivity and session store mode. Returns `503` when dependencies are not ready.

Structured JSON logs now include:
- request-level access logs with `x-request-id`,
- auth audit events,
- CMS persistence failure events,
- bootstrap mode visibility (storage/session/email).

## Current maturity notes

- The app has good structural foundations but is still **pre-production**.
- Auth durability is not guaranteed unless Mongo/session-store dependencies and configuration are enforced.
- Content persistence is split across backend file storage and frontend localStorage repositories.
- Backend password-reset endpoints exist, but dedicated frontend reset-password pages are not yet wired.
- Existing lint/typecheck scripts are lightweight smoke checks, not full static-analysis gates.

## Production notes (concise)

Before production release, prioritize:
1. Hard fail on non-persistent auth/session mode in production.
2. Unify CMS content persistence under one authoritative backend model.
3. Complete account lifecycle UI (password reset flow).
4. Add real observability (metrics/log correlation/alerts).
5. Strengthen CI with full lint/typecheck and browser E2E critical flows.

## Useful commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
# optional (after adding @playwright/test in your environment): npx playwright test tests/e2e/critical-flows.spec.ts
npm run build
npm run ops:backup
npm run ops:verify-integrity
# restore from a backup folder
npm run ops:restore -- server/backups/backup-<timestamp>
```

## Deployment and recovery runbooks

- Deployment checklist: `docs/runbooks/DEPLOYMENT_CHECKLIST.md`
- Rollback checklist: `docs/runbooks/ROLLBACK_CHECKLIST.md`
- Auth/content recovery guide: `docs/runbooks/AUTH_AND_CONTENT_RECOVERY.md`

These runbooks define the operational path for backup, restore, media recovery, and auth/content incident handling.
