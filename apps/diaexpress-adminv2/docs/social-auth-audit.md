# Social Auth Audit (Google / Facebook)

> Date: 2026-04-03
> Scope requested: `apps/diaexpress-adminv2` then backend.
> Repository reality: this repo does **not** contain `apps/diaexpress-adminv2` or `services/diaexpress-backend`. The closest active auth surfaces audited are:
> - Frontend: `src/components/auth/LoginPage.tsx`, `src/contexts/AuthContext.tsx`, `src/utils/authApi.ts`
> - Backend: `server/controllers/authController.js`, `server/services/authService.js`, `server/config/env.js`, `server/models/User.js`, `server/repositories/authRepository.mongo.js`

## 1) État Google Login

- Backend OAuth Google flow is present and complete:
  - Start URL generation: `/auth/oauth/google/start`
  - Callback handling with code exchange and userinfo fetch.
- Provider availability is exposed by `/auth/oauth/providers` and consumed in frontend state.
- **Issue found (frontend):** `src/components/auth/LoginPage.tsx` did not use OAuth redirect flow. It used `window.prompt(...)` and posted mocked payload to `/auth/oauth/:provider`, which bypasses real OAuth and fails in real-world usage.
- Redirect and session creation are otherwise implemented server-side via `startOAuth` + `handleOAuthCallback` + session regeneration.

## 2) État Facebook Login

- Backend OAuth Facebook flow exists (`/dialog/oauth`, access token exchange, Graph profile fetch).
- Backend includes fallback behavior when email is absent from Facebook profile: reject account creation unless provider already linked.
- **Issue found (frontend):** same as Google in `LoginPage.tsx` (mock prompt flow), causing unreliable/non-functional production login.

## 3) Causes probables des erreurs

### Cause A — Frontend flow mismatch (principal)
The admin login page uses fake prompt-based OAuth payload instead of redirecting to provider authorization endpoint, which breaks:
- provider consent journey,
- callback-based session creation,
- secure state validation.

### Cause B — Duplicate key race windows (`E11000`) in backend
OAuth user creation catches duplicate key errors but returns generic conflict immediately. In race scenarios (same email/provider concurrently), backend should recover by fetching and linking/reusing existing account rather than failing.

### Cause C — UX errors not explicit enough
When provider is disabled/misconfigured, buttons are only disabled; no clear explanation is shown to user.

## 4) Dev vs Prod differences

- In dev, defaults (`localhost`) and less strict operational setup can hide misconfig.
- In prod:
  - callback URL mismatch immediately breaks OAuth;
  - missing one credential of a pair throws startup validation error;
  - frontend origin allow-list (`FRONTEND_ORIGINS`) must include actual admin host;
  - Mongo unique indexes make race conditions visible (`E11000`).

## 5) Correctifs proposés

1. Replace prompt-based OAuth with redirect start flow on login UI (`beginOAuthLogin`) and keep callback/session pipeline unchanged.
2. Add user-facing provider-configuration feedback in UI.
3. Improve backend duplicate handling by converting `E11000` into recovery path:
   - refetch by provider ID,
   - else refetch by normalized email and link,
   - only return conflict if unresolved.
4. Document env/callback configuration and troubleshooting in README docs.

