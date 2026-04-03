# diaexpress-adminv2 — Social Auth Setup

> Note: in this repository, the closest implementation currently lives in `src/` and `cms/src/`.

## Google Login configuration

Required backend env vars:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` (or `GOOGLE_CALLBACK_PATH` + `API_ORIGIN`)

Google Console:
1. Create OAuth Web Application credentials.
2. Authorized redirect URI must match backend callback exactly, for example:
   - `http://localhost:3001/api/v1/auth/oauth/google/callback`
3. Consent scopes expected by backend: `openid email profile`.

## Facebook Login configuration

Required backend env vars:
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_CALLBACK_URL` (or `FACEBOOK_CALLBACK_PATH` + `API_ORIGIN`)

Facebook App setup:
1. Enable Facebook Login for Web.
2. Set valid OAuth redirect URI to backend callback, for example:
   - `http://localhost:3001/api/v1/auth/oauth/facebook/callback`
3. Request `email` permission in addition to `public_profile`.

## Required environment variables (summary)

- `API_ORIGIN`
- `FRONTEND_ORIGIN`
- `FRONTEND_ORIGINS` (if multiple hosts)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` or `GOOGLE_CALLBACK_PATH`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_CALLBACK_URL` or `FACEBOOK_CALLBACK_PATH`

## Local testing checklist

1. Start backend and frontend.
2. Open login page.
3. Verify providers via `GET /api/v1/auth/oauth/providers`.
4. Click social button and complete provider consent.
5. Confirm redirect returns to `#login` or target route and user session is present via `GET /api/v1/auth/session`.

## Frequent errors & solutions

- `OAUTH_PROVIDER_DISABLED`
  - Missing or incomplete provider credentials.
- `OAUTH_STATE_INVALID`
  - Session/state mismatch (stale tab, cookies blocked, or mismatched origins).
- `OAUTH_TOKEN_EXCHANGE_FAILED`
  - Wrong client secret or callback URI mismatch.
- `OAUTH_PROFILE_FETCH_FAILED`
  - Provider API/network issue or invalid token.
- `OAUTH_EMAIL_REQUIRED` (often Facebook)
  - Email permission not granted and no prior account link exists.

