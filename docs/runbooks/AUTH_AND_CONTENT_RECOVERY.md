# Auth + Content Recovery Runbook

## Auth incident (users cannot login)
1. Check readiness: `/api/v1/ready` should report Mongo + session-store ready.
2. Inspect recent audit events:
   - `/api/v1/auth/admin/audit-events`
   - `/api/v1/content/admin/audit-events`
3. Validate session secret drift and cookie domain changes.
4. If required, restore Mongo auth/session data from latest valid dump.

## Content write failures
1. Check server logs for `cms_*_failed` and `audit_persist_failed` events.
2. Run `npm run ops:verify-integrity`.
3. If upload blobs are missing, restore `server/data/uploads` from backup.
4. If `content.json` schema drift exists, restart service to apply migration normalization and inspect `migrationHistory`.

## Media upload failures
1. Confirm MIME and size constraints against env values.
2. Confirm writable `MEDIA_UPLOAD_DIR`.
3. Retry upload and check audit event `cms_media_upload` with failure metadata.

## Audit persistence degraded
1. Check file permissions for `server/data/audit-log.json`.
2. Ensure disk has free space.
3. If file corruption occurs, restore `audit-log.json` from backup and restart.
