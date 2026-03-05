# Release checklist V3

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run db:migrate:v3` sur staging
- [ ] Vérifier `/api/health`
- [ ] Vérifier login/logout + CSRF + rate-limit
- [ ] Vérifier RBAC (admin/editor/author/viewer)
- [ ] Vérifier soft delete post (status=removed)
- [ ] Vérifier dashboard summary + pagination posts
- [ ] Déployer prod + smoke test URLs publiques
