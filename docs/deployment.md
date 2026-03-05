# Deployment

## CI
Pipeline GitHub Actions: lint, typecheck, tests, build.

## Variables
- `MONGO_URI`
- `SESSION_SECRET`
- `CLIENT_ORIGIN`
- `APP_VERSION`
- `LOG_LEVEL`
- OAuth providers optionnels

## Cible
- Front Vite: Vercel/Netlify
- API Express: Render/Fly.io/Vercel serverless adapter (si nécessaire)
