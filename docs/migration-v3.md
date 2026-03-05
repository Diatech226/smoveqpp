# Migration V3

## Pré-requis
- Sauvegarde MongoDB (`mongodump`).
- Variables `MONGO_URI`, `SESSION_SECRET` et `SESSION_SECRET_PREVIOUS` documentées.

## Étapes
1. Installer dépendances: `npm ci`
2. Exécuter la migration: `npm run db:migrate:v3`
3. Démarrer API et vérifier: `GET /api/health`
4. Vérifier permissions avec comptes admin/editor/author/viewer.

## Ce que fait la migration
- `status: null|missing -> published`
- Mapping legacy `deletedAt -> status=removed`
- Création indexes: `slug(unique)`, `status`, `publishedAt`, `category`
