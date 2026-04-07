# diaexpress-backend — Social Auth Sync & RBAC Notes

> Note: backend implementation in this repository is under `server/`.

## How user sync works after social auth

Flow:
1. `/auth/oauth/:provider/start` builds provider authorization URL.
2. `/auth/oauth/:provider/callback` validates state, exchanges code, fetches profile.
3. `AuthService.loginWithOAuthProfile(...)` resolves user in order:
   - by provider ID (`googleId` / `facebookId`),
   - else by normalized email,
   - else creates new user.
4. Session is regenerated and persisted server-side.

## Preventing Mongo duplicates

Unique indexes exist on:
- `email`
- `googleId`
- `facebookId`
- `(authProvider, providerId)`

Duplicate key race handling (`E11000`) is now resilient:
- on duplicate during create, backend refetches by provider,
- else refetches by email and links provider,
- only returns conflict if recovery is impossible.

## Admin role / whitelist / seed admin

Current admin bootstrap is env-based:
- `SEED_ADMIN_ON_START=true`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`

Behavior:
- if admin email already exists, seed does not recreate.
- social login keeps existing role/status when linking by email, so existing admins keep admin access.

## Troubleshooting

### `E11000 duplicate key`
- Ensure only one canonical email format (lowercase/trim).
- Verify provider IDs are unique and not reused across users.
- If race happened, retry login once; recovery path should link/reuse account.

### `/api/users/me` or session identity issues
- In this codebase identity endpoint is `GET /api/v1/auth/session`.
- Confirm frontend sends cookies (`credentials: include`).
- Confirm session store and `SESSION_SECRET` are stable across requests.

### Backend session auth
- Current implementation is custom session auth (no Legacy provider SDK in repo).
- If Legacy provider is reintroduced, keep single source of truth for backend session and explicit user-link mapping to avoid duplicate user creation.

