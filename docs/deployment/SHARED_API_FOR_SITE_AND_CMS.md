# Shared API for Site + CMS

## Architecture (single backend API)

```text
┌──────────────────────┐        ┌──────────────────────────────────┐
│ Public Site (Vite)   │ ─────► │                                  │
│ uses /api/v1/content │        │                                  │
└──────────────────────┘        │                                  │
                                │  Shared Express API (apps/api)   │
┌──────────────────────┐        │  /api/v1/*                        │
│ CMS (Vite)           │ ─────► │  - public endpoints               │
│ uses /api/v1/*       │        │  - protected/admin endpoints      │
└──────────────────────┘        │                                  │
                                └───────────────┬──────────────────┘
                                                │
                                   ┌────────────▼────────────┐
                                   │ Shared MongoDB + sessions│
                                   │ Shared media storage     │
                                   │ (uploads + content state)│
                                   └──────────────────────────┘
```

**Source of truth:** CMS writes to the shared API; public site reads from the same API, same DB/content repository, and same media storage paths.

## Endpoint separation (same API)

### Public read endpoints (site)
- `GET /api/v1/content/public/services`
- `GET /api/v1/content/public/projects`
- `GET /api/v1/content/public/blog`
- `GET /api/v1/content/public/blog/:slug`
- `GET /api/v1/content/public/page-content`
- `GET /api/v1/content/public/media`

### Protected CMS content endpoints (auth + RBAC)
- `GET /api/v1/content/services`
- `POST /api/v1/content/services`
- `PATCH /api/v1/content/services/:id`
- `DELETE /api/v1/content/services/:id`
- `GET /api/v1/content/projects`
- `POST /api/v1/content/projects`
- `PATCH /api/v1/content/projects/:id`
- `DELETE /api/v1/content/projects/:id`
- `GET /api/v1/content/blog`
- `POST /api/v1/content/blog`
- `PATCH /api/v1/content/blog/:id`
- `DELETE /api/v1/content/blog/:id`
- `GET /api/v1/content/page-content`
- `POST /api/v1/content/page-content`
- `PATCH /api/v1/content/page-content`
- `GET /api/v1/content/media`
- `POST /api/v1/content/media/upload`
- `POST /api/v1/content/media`
- `DELETE /api/v1/content/media/:id`

### Protected operational/admin endpoints on same API
- Users / auth admin:
  - `GET /api/v1/auth/admin/users`
  - `PATCH /api/v1/auth/admin/users/:userId`
- Newsletter:
  - `POST /api/v1/newsletter`
  - `GET /api/v1/newsletter/admin/subscribers`
  - `PATCH /api/v1/newsletter/admin/subscribers/:id`
- Contact submissions:
  - `POST /api/v1/contact`
  - `GET /api/v1/contact/admin/submissions`

## Environment variables

Use the same backend target for both frontends.

### Site
```env
VITE_API_BASE_URL=/api/v1
VITE_API_ORIGIN=https://api-or-same-domain.com
```

### CMS
```env
VITE_API_BASE_URL=/api/v1
VITE_API_ORIGIN=https://api-or-same-domain.com
```

### API
```env
API_ORIGIN=https://api-or-same-domain.com
FRONTEND_ORIGINS=https://site-domain.com,https://cms-domain.com
MONGO_URI=...
SESSION_SECRET=...
```

## CORS / origin setup

- API CORS allow-list is driven by `FRONTEND_ORIGINS` (plus normalized local defaults in development).
- Cookies/session auth is enabled with `credentials: true`.
- In production with separate domains, ensure:
  - `FRONTEND_ORIGINS` includes both site and CMS origins.
  - HTTPS is used for all origins.
  - session cookie policy remains `SameSite=None; Secure`.

## Deployment options

### 1) Same domain (recommended simplicity)
- Site and CMS served from same domain (e.g. `https://example.com` and `https://example.com/cms`).
- API served on same domain under `/api/v1`.
- Minimal CORS complexity; shared cookies naturally align.

### 2) Separate frontend domains + one API domain
- Site on `https://site.example.com`
- CMS on `https://cms.example.com`
- API on `https://api.example.com`
- Configure:
  - both frontends with `VITE_API_BASE_URL=/api/v1`
  - both frontends with `VITE_API_ORIGIN=https://api.example.com`
  - API with `FRONTEND_ORIGINS=https://site.example.com,https://cms.example.com`

## Validation checklist

1. Login to CMS and update content (service/project/blog/page content/media).
2. Verify data persisted through `/api/v1/content/*` protected endpoints.
3. Verify public site reflects changes via `/api/v1/content/public/*` endpoints.
4. Verify newsletter/contact entries appear via admin endpoints in CMS.
5. Verify no legacy frontend is pointing at a second API origin.
