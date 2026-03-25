# SMOVE CMS (Standalone App)

This CMS is now self-contained under `cms/src` and can be built/deployed independently from the public site frontend.

## Boundaries

- **CMS-only code** lives in `cms/src`.
- CMS no longer imports runtime files from `../src` (public site source tree).
- Shared domain/helpers required by CMS runtime are vendored under `cms/src/shared`, `cms/src/utils`, `cms/src/repositories`, and `cms/src/features` to keep standalone deployability.

## Local run

```bash
npm --prefix cms run dev
```

Default URL: `http://127.0.0.1:5174/#cms`

## Build

```bash
npm --prefix cms run build
npm --prefix cms run preview
```

## Environment

Copy and edit:

```bash
cp cms/.env.example cms/.env.local
```

Required runtime integration:
- backend API reachable at `VITE_API_ORIGIN`
- API base path via `VITE_API_BASE_URL` (default `/api/v1`)
- public return URL via `VITE_PUBLIC_APP_URL`
