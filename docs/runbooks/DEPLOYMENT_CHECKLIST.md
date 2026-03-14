# Deployment Checklist (Production)

## Pre-deploy
- Confirm `AUTH_STORAGE_MODE=mongo` and `SESSION_STORE_MODE=mongo`.
- Confirm strong `SESSION_SECRET` (>= 32 chars).
- Confirm `MONGO_URI` and `MONGO_DB_NAME` are set and reachable.
- Confirm media settings: `MEDIA_UPLOAD_DIR`, `MEDIA_MAX_UPLOAD_BYTES`, `MEDIA_ALLOWED_MIME_TYPES`.
- Create backup before release:
  - `npm run ops:backup`
  - `mongodump --uri "$MONGO_URI" --out server/backups/mongo-<timestamp>`

## Deploy
- Deploy backend and frontend.
- Verify health:
  - `curl -f http://<host>/api/v1/health`
  - `curl -f http://<host>/api/v1/ready`
- Verify auth session bootstrap (`/api/v1/auth/session`).
- Verify CMS media upload path (`/api/v1/content/media/upload`) from admin/editor session.

## Post-deploy verification
- Run: `npm run ops:verify-integrity`.
- Confirm audit persistence via `/api/v1/content/admin/audit-events` and `/api/v1/auth/admin/audit-events`.
- Confirm uploaded media files exist under `MEDIA_UPLOAD_DIR`.
