# SMOVE V5 — Architecture modulaire (intelligente / composable / revenue-driven)

## 1) Audit des modèles existants (V4)

Le socle existant expose déjà :
- `Tenant`, `User`, `Post`, `AuditLog` côté API.
- Auth session + CSRF + RBAC.
- Multi-tenant logique et branding public (`/api/public/brand`, `/api/v1/brand`).

Limites constatées avant V5:
- Pas de modèle de personnalisation dynamique (variants/règles/segments).
- Pas de modèle lead/revenue unifié.
- Pas de couche jobs abstraite pour orchestration business.
- Pas de recherche CMS transverse multi-entités.

## 2) Cartographie des écarts V4 -> V5

### Personnalisation
- **Nouveau**: `ContentVariant`, `PersonalizationRule`, `AudienceSegment`.
- **Activation**: `FEATURE_V5_PERSONALIZATION`.

### Revenue / conversion
- **Nouveau**: `Lead` (capture formulaire + scoring + routing).
- **Activation**: `FEATURE_V5_LEADS`.

### Automation
- **Nouveau**: `Job` + endpoint runner interne.
- **Activation**: `FEATURE_V5_JOBS`.

### Discovery
- **Nouveau**: recherche transverse `/api/cms/v5/search` (posts, leads, variants, users).
- **Activation**: `FEATURE_V5_GLOBAL_SEARCH`.

## 3) Proposition d’architecture modulaire

Approche retenue:
1. Ajout de briques V5 côté API **sans rupture** des routes existantes.
2. Préfixes V5 dédiés (`/api/v5/*`, `/api/cms/v5/*`, `/api/public/forms/*`, `/api/internal/jobs/*`).
3. Activation incrémentale par feature flags (toggle par environnement/tenant).
4. Réutilisation des patterns sécurité existants (RBAC, CSRF, rate limit, audit logs).

## 4) Plan de migration sans régression

1. Déployer schémas V5 en lecture/écriture, flags OFF en production.
2. Créer segments + variants + règles sur tenant pilote.
3. Basculer `FEATURE_V5_PERSONALIZATION=true` pour tenant pilote.
4. Activer forms leads (`FEATURE_V5_LEADS`) et monitorer qualité de scoring/routing.
5. Activer queue jobs (`FEATURE_V5_JOBS`) avec token runner dédié.
6. Activer recherche transverse (`FEATURE_V5_GLOBAL_SEARCH`) côté CMS.
7. Étendre tenant par tenant après validation KPI/erreurs.

## 5) Observabilité et sécurité

- Chaque création V5 clé est journalisée (`AuditLog`).
- Jobs exécutés via endpoint interne protégé par `X-Job-Token`.
- Aucune route publique existante retirée ou renommée.
- Les endpoints sensibles conservent protection CSRF et rate limiting.
