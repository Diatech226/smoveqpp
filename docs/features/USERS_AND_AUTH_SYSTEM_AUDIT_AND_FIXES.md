# Users & Auth System Audit and Fixes

## Architecture after fixes
- **Single source of truth** remains the backend session (`/api/v1/auth/session`) and server-side role/account-status checks.
- Site and CMS clients now both:
  - bootstrap session with timeout + explicit error mapping,
  - fetch OAuth provider availability from `/auth/oauth/providers`,
  - maintain coherent auth/session state in their React auth providers.
- Public auth actions use CSRF bootstrap before write operations (`login/register/logout/password-reset`).

## Login / signup / reset flows
- Login flow hardened with consistent API error normalization and session-based auth state updates.
- Registration flow preserved, with duplicate-email and validation mapping surfaced consistently.
- Added complete public-site UI and client plumbing for:
  - `#forgot-password` → POST `/auth/password-reset/request`
  - `#reset-password?token=...` → POST `/auth/password-reset/confirm`
- Reset path now provides explicit invalid/expired token feedback via backend error codes.

## Google (and OAuth) flow
- Site + CMS now consume real provider flags from backend instead of hardcoded enabled values.
- OAuth buttons reflect runtime provider availability and avoid fragmented UI state when provider is disabled.

## Session/account coherence and role/permission behavior
- Site and CMS auth contexts now align around server-provided session/user payloads.
- Site security policy now blocks suspended users from CMS access just like CMS policy.
- Route guards include password-reset pages and avoid incoherent redirects for authenticated sessions.

## Users/admin section reliability
- Existing backend admin role/account checks retained.
- CMS/user auth API now has corrected session bootstrap signature and consistent timeout/error handling.

## Safeguards and validation rules
- Password reset remains non-enumerating: unknown emails return generic success.
- Password reset confirmation enforces token presence + password minimum length.
- OAuth and auth operations remain rate-limited and CSRF-protected where required.
