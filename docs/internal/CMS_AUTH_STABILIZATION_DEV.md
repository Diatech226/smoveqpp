# CMS auth stabilization (development)

Date: 2026-04-07

## Current stabilization rule

- CMS authentication is now **local-session-first** in development.
- Canonical CMS auth path:
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/session`
  - `POST /api/v1/auth/logout`
- CMS role/access gating is based on the backend session-resolved user (`role`, `accountStatus`).

## Clerk isolation changes

- Clerk is no longer the first source of truth for CMS auth state.
- Missing Clerk tokens or Clerk bootstrap issues must not block local CMS admin login.
- Clerk can still be used in non-CMS-critical paths, but CMS access decisions must resolve from backend session state.

## Backend authorization changes for CMS admin flows

- CMS-critical admin auth routes now accept authenticated local sessions:
  - `GET /api/v1/auth/admin/users`
  - `PATCH /api/v1/auth/admin/users/:userId`
  - `GET /api/v1/auth/admin/audit-events`
- RBAC is still enforced through existing permission checks.

## Seed/admin consistency hardening

- Startup admin seeding now repairs an existing configured admin identity to:
  - role `admin`
  - staff status
  - active account status
  - local provider enabled (and local password hash present if missing)

## Follow-up (not part of this stabilization)

- Unify long-term auth architecture so Clerk and local session identity are not dual-source.
- Remove remaining duplicate auth surfaces once production migration plan is approved.
