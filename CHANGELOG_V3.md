# CHANGELOG V3

## 3.0.0
- Hardening auth: rate limiting, session regeneration on login, strict CSRF enforcement.
- RBAC expanded to `admin/editor/author/viewer` with action-based guards.
- Post lifecycle extended with `removed` + soft-delete endpoint behavior.
- Added `AuditLog` collection and event tracking for critical auth/CMS actions.
- Added `/api/health` endpoint and structured server logs via `pino`.
- Added paginated CMS posts endpoint and dashboard summary endpoint.
- Added migration script `npm run db:migrate:v3` (legacy status cleanup + indexes).
- Added unit tests for Zod validation and media variant mapping.
- Added CI workflow with lint, typecheck, tests, and build gates.
- Added V3 docs: audit, migration, deployment, runbook, release checklist.
