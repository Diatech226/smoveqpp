# Public users and CMS RBAC

## Purpose

The public site and CMS share the API session, but authentication and CMS authorization are separate decisions:

- Any visitor may register and log in on the public site when email/password auth and public registration are enabled.
- A successful registration or login creates an authenticated server session regardless of the user's role.
- Only `admin`, `editor`, and `author` roles may open the CMS or call protected CMS content routes.
- Authenticated `client`, `user`, and `viewer` accounts are normal public users and receive the CMS forbidden state rather than a login/session error.

## Production topology

- Public site: `https://www.smovecommunication.com`
- CMS: `https://smoovecms.vercel.app`
- API: `https://smoveapi-1.onrender.com`

Both frontend origins must be present in the API `FRONTEND_ORIGINS`/CORS configuration. Browser requests use `credentials: include` so the API session cookie is shared with both frontend applications.

## API configuration

```env
ENABLE_EMAIL_PASSWORD_AUTH=true
PUBLIC_REGISTRATION_ENABLED=true
DEFAULT_PUBLIC_ROLE=client
```

`DEFAULT_PUBLIC_ROLE` accepts only `client` or `user`. Any unsafe or unsupported configured value falls back to `client`. `POST /api/v1/auth/register` ignores a request body's `role` field, so a public request can never create an admin, editor, or author account.

When public registration is disabled, registration returns **403** with `REGISTRATION_DISABLED`. When email/password authentication is disabled, registration and login return **403** with `EMAIL_PASSWORD_AUTH_DISABLED`.

## Public authentication routes

These routes do not require a CMS role:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/session`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/oauth/providers`

State-changing auth requests still use CSRF protection and auth rate limiting. Those controls do not require an existing authenticated user or CMS role.

### HTTP status semantics

- **200/201**: authentication or registration succeeded and the response contains the authenticated user/session.
- **401 Unauthorized**: credentials are invalid or a protected route has no authenticated session.
- **403 Forbidden**: authentication exists but the role/account state does not allow the action, or the requested auth feature is disabled.

A valid normal-user session must never be described as missing or as an authentication error solely because it lacks CMS access.

## Public site flow

The public site exposes login and registration independently of the CMS feature flag.

1. A visitor registers; the API assigns `DEFAULT_PUBLIC_ROLE` and starts a session.
2. A normal user lands in the account/profile area after registration or login.
3. An admin/editor/author also remains in the public account area after login.
4. Authorized CMS roles see the **Accéder au CMS** link; public users do not.
5. The site never automatically redirects an admin to the CMS.

Recommended public-site flags:

```env
VITE_ENABLE_CMS=true
VITE_ENABLE_REGISTRATION=true
VITE_ENABLE_EMAIL_PASSWORD_AUTH=true
```

## CMS flow and roles

The CMS checks `GET /api/v1/auth/session` before choosing a page:

| Session state | CMS result |
| --- | --- |
| No authenticated user | CMS login page |
| Authenticated `admin`, `editor`, or `author` | Dashboard |
| Authenticated `client`, `user`, or `viewer` | **Accès refusé au CMS** |

The CMS may authenticate any valid account. If a normal user logs in from the CMS login page, login succeeds, the session remains valid, and the UI immediately navigates to the forbidden page.

Recommended CMS flags:

```env
VITE_ENABLE_CMS=true
VITE_ENABLE_REGISTRATION=false
VITE_ENABLE_EMAIL_PASSWORD_AUTH=true
```

Public account creation is intentionally exposed by the site, not the CMS UI.

## Protected CMS API routes

Protected content and management routes require permissions held only by `admin`, `editor`, or `author`. Normal roles have no protected CMS content-read or content-write permission. Public content routes remain public.

Role summary:

| Role | Public account/session | CMS access | Protected CMS content |
| --- | --- | --- | --- |
| `admin` | Yes | Yes | Yes, including administration |
| `editor` | Yes | Yes | Yes, editorial permissions |
| `author` | Yes | Yes | Yes, author permissions |
| `client` | Yes | No | No |
| `user` | Yes | No | No |
| `viewer` | Yes | No | No |

## Validation checklist

1. Register a new account from the public site and verify its role is `client` or `user` even if the request includes `role=admin`.
2. Log in with that account and verify the public account/profile area loads.
3. Open the CMS with the same session and verify **Accès refusé au CMS** appears.
4. Log out, then log in on the public site as an admin/editor/author and verify the account page shows **Accéder au CMS** without redirecting automatically.
5. Open the CMS and verify the dashboard loads.
6. Verify invalid credentials return **401**, while disabled auth/registration and authenticated role denials return **403**.
