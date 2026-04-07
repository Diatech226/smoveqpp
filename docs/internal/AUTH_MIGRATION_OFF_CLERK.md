# AUTH_MIGRATION_OFF_CLERK

## Canonical auth architecture
- Clerk removed from runtime.
- Single source of truth: MongoDB user records + backend sessions.
- Site and CMS both resolve auth state from `/api/v1/auth/session`.

## Local auth flow
1. GET `/api/v1/auth/session` to obtain CSRF token.
2. POST `/api/v1/auth/register` or `/api/v1/auth/login` with CSRF header.
3. Backend regenerates session and sets `smove.sid` cookie.
4. Frontends refresh user state from `/session`.

## Google auth flow (backend verified)
1. Frontend redirects to `/api/v1/auth/oauth/google/start`.
2. Backend stores OAuth state in session.
3. Callback exchanges authorization code with Google token endpoint.
4. Backend fetches Google OIDC profile and verifies provider identity server-side.
5. Backend links or creates user record, then creates normal app session.

## Account linking logic
- find by provider id (`googleId`) first
- else find by normalized email
- else create new user with default role/status
- preserve existing role/accountStatus when linking existing accounts
- prevent duplicate users with DB unique indexes + duplicate-key recovery path

## Mongo/session requirements
- `AUTH_STORAGE_MODE=mongo`
- `SESSION_STORE_MODE=mongo`
- `MONGO_URI` configured
- `mongoose` and `connect-mongo` installed in runtime

## Admin access model
- Seeded admin persists in MongoDB.
- CMS access checks evaluate backend session user role/accountStatus.
- Admin endpoints require authenticated session + permission checks.
