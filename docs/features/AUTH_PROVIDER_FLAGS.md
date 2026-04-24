# Auth provider feature flags

## Current default mode

The app is configured for **email/password authentication only** by default:

- Email/password sign-in: enabled
- Email/password registration: enabled
- Google OAuth: disabled
- Facebook OAuth: disabled

## Environment flags

### Frontend (CMS)

```bash
VITE_ENABLE_EMAIL_PASSWORD_AUTH=true
VITE_ENABLE_GOOGLE_LOGIN=false
VITE_ENABLE_FACEBOOK_LOGIN=false
```

### Backend (API)

```bash
ENABLE_EMAIL_PASSWORD_AUTH=true
PUBLIC_REGISTRATION_ENABLED=true
ENABLE_GOOGLE_LOGIN=false
ENABLE_FACEBOOK_LOGIN=false
```

## Behavior when social providers are disabled

- Login/register screens keep email/password forms visible.
- Google/Facebook buttons are hidden.
- OAuth provider endpoints return a clear `403 OAUTH_PROVIDER_DISABLED` response when disabled.
- API startup does not require Google/Facebook secrets while provider flags are `false`.

## Enabling Google login later

1. Set:
   - `ENABLE_GOOGLE_LOGIN=true`
   - `VITE_ENABLE_GOOGLE_LOGIN=true`
2. Provide backend credentials:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
3. Configure callback URL in Google Cloud Console:
   - `${API_ORIGIN}/api/v1/auth/oauth/google/callback`
   - default local value: `http://localhost:3001/api/v1/auth/oauth/google/callback`

## Enabling Facebook login later

1. Set:
   - `ENABLE_FACEBOOK_LOGIN=true`
   - `VITE_ENABLE_FACEBOOK_LOGIN=true`
2. Provide backend credentials:
   - `FACEBOOK_APP_ID`
   - `FACEBOOK_APP_SECRET`
3. Configure callback URL in Meta app settings:
   - `${API_ORIGIN}/api/v1/auth/oauth/facebook/callback`
   - default local value: `http://localhost:3001/api/v1/auth/oauth/facebook/callback`

