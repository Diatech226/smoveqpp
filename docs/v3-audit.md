# V3 Audit Production-Grade (P0 / P1 / P2)

## P0 (bloquant prod)
- Durcir authentification: rate-limit login/register, rotation de session à la connexion, CSRF strict sur routes sensibles.
- Mettre en place RBAC multi-rôles (admin/editor/author/viewer) avec guards action-based.
- Remplacer suppression physique des posts par soft-delete (`status=removed`).
- Ajouter endpoint `/api/health` et logs structurés pour diagnostic incident.

## P1 (fortement recommandé)
- Audit log des actions critiques (login/logout/create/update/delete).
- Pagination systématique des listes CMS + endpoint `summary` pour dashboard.
- Script de migration V3 pour normaliser les statuts legacy et indexes Mongo.
- CI stricte: lint + typecheck + tests + build.

## P2 (amélioration continue)
- E2E Playwright de bout en bout (auth -> post -> publish).
- Intégration Sentry admin/public avec runbook d'escalade.
- Versioning éditorial (PostRevision + restore version).

## Plan de commits atomiques
1. `feat(api): harden auth, RBAC, soft-delete, audit log, health, pagination`
2. `test(tooling): add zod/media unit tests, lint/typecheck, ci workflow`
3. `docs(v3): add migration guide, release checklist, runbook and deployment notes`
