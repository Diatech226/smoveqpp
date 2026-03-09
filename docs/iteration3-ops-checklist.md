# Iteration 3 Operational Checklist

## Release
- Validate auth/session login/logout
- Validate RBAC (admin/editor/author/viewer)
- Validate tenant isolation on users and audit logs
- Validate media upload and deletion
- Validate jobs runner retry behavior

## Smoke tests
- GET /api/v1/users
- POST /api/v1/users/invite
- PATCH /api/v1/users/:id/role
- PATCH /api/v1/users/:id/status
- GET /api/v1/audit-logs
- GET /api/v1/analytics/overview

## Post-deploy watchpoints
- failedJobs metric drift
- invite errors and conflicts
- audit log growth and pagination
