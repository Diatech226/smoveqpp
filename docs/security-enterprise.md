# V5 Security Enterprise Readiness

## Contrôles conservés
- Session server-side avec cookie httpOnly.
- CSRF obligatoire sur endpoints write sensibles.
- RBAC action-based (`requireAction`).
- Rate limiting auth + routes sensibles.

## Contrôles V5 ajoutés
- Feature flags pour activer chaque module V5 indépendamment.
- Job runner interne protégé par token (`X-Job-Token`).
- Audit trail étendu sur segments/variants/rules/leads/jobs.

## Recommandations enterprise (prochaine étape)
- Rotation régulière `SESSION_SECRET` et `JOB_RUNNER_TOKEN`.
- SSO/SAML readiness via provider d’identité central.
- 2FA admin pour opérations CMS critiques.
- Signature HMAC pour futurs webhooks sortants.
- Data retention policy pour leads et logs.
