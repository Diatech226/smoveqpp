# SMOVE V4 — Enterprise / Multi-tenant / Growth Engine

## 1) Cartographie des modules actuels (V3)

### Frontend (Vite + React)
- `src/components/*` : pages publiques (blog, projets, services, contact) et expérience CMS côté client.
- `src/components/cms/CMSDashboard.tsx` : dashboard éditorial principal.
- `src/data/*` : contenu seed/fallback (posts, projets, taxonomies, settings de marque, médias).
- `src/contexts/AuthContext.tsx` + `src/utils/authApi.ts` : session/auth côté client.

### API backend (Express + MongoDB/Mongoose)
- `server/index.js` : serveur unique contenant:
  - Auth (local + social providers).
  - Session + CSRF.
  - CRUD CMS `posts`.
  - Endpoint `brand` public.
  - Audit logs.
- `server/migrate-v3.js` : migration utilitaire V3.

### Exploitation / docs
- `docs/v3-audit.md`, `docs/migration-v3.md`, `docs/release-checklist-v3.md` : base d’exploitation V3.
- `ROADMAP_V4.md` : orientation macro V4 déjà posée.

---

## 2) Écarts V3 → V4

## Données & domaine
- **Manquant en V3**: modèle `Tenant` formel avec branding/domaine/statut.
- **Partiellement présent**: branding global non-tenant dans `/api/public/brand`.
- **Nécessaire V4**:
  - Ajout `tenantId` sur entités clés (posts déjà fait au socle, users/audit partiellement tenantifiés).
  - Mapping domaine/host → tenant.

## Publication & distribution
- **Manquant**: `DistributionTarget`, `DistributionJob`, `PublicationLog`.
- **Nécessaire**: couche connecteurs + historique + statut sync.

## Automation éditoriale
- **Manquant**: file de jobs éditoriaux, règles trigger, suggestions IA.
- **Nécessaire**: moteur de règles et queue orientée tâches CMS.

## Analytics business
- **Manquant**: pipeline KPI, tracking CTA/scroll/form, exports reporting.
- **Nécessaire**: instrumentation unifiée + tables de consolidation.

## Forms & landing
- **Manquant**: builder formulaires, stockage lead, landing CMS.
- **Nécessaire**: schéma `Lead`, `FormDefinition`, `FormSubmission`, pages marketing.

## Headless API produit
- **Manquant**: API versionnée complète `/api/v1/*`, webhooks sortants.
- **Nécessaire**: contrats versionnés + sécurité (scopes, quotas, signatures).

## Gouvernance / conformité
- **Manquant**: politiques de rétention, suppression RGPD automatisée, logs conformité.
- **Nécessaire**: modèles policy + jobs de purge + export/suppression data subject.

---

## 3) Dépendances critiques

### Techniques
1. **Stratégie de multi-tenancy**: partition logique par `tenantId` dans MongoDB (court terme) avant éventuelle séparation physique.
2. **Indexation**: index composés `tenantId + slug`, `tenantId + status + updatedAt` pour éviter régressions performance.
3. **Compatibilité API**: routes publiques existantes maintenues, ajout progressif `/api/v1`.
4. **Feature flags**: activation contrôlée des briques V4 (`FEATURE_MULTI_TENANT`, `FEATURE_BRAND_API_V1`, etc.).

### Produit / Ops
1. Process d’onboarding tenant (slug, domaine, branding minimal).
2. Politique de gouvernance contenu par tenant.
3. Pipeline analytics commun et choix fournisseur (PostHog/Plausible/GA4).
4. Standards de distribution omnicanale (quotas API, retries, observabilité).

---

## 4) Plan de migration recommandé

## Phase A — Multi-tenant core (priorité immédiate)
1. Introduire `Tenant` + tenant par défaut.
2. Ajouter `tenantId` sur objets cœur (posts/users/settings/media/taxonomies/services/projects/events).
3. Mettre en place résolution tenant (`query`, header, host/domain).
4. Ajouter index composés et scripts de backfill pour données existantes.
5. Maintenir rétrocompatibilité en fallback sur tenant `default`.

## Phase B — Distribution & automation
1. Créer tables/collections `DistributionTarget`, `DistributionJob`, `PublicationLog`.
2. Ajouter workers et retries.
3. Ajouter suggestions IA et templates contextuels (feature-flag).

## Phase C — Business platform
1. Form builder + leads.
2. Tracking événementiel + dashboard KPI enrichi.
3. Reporting CSV/PDF + envoi mensuel automatique.

## Phase D — Headless & enterprise
1. Stabiliser `/api/v1` (content, brand, media, services, projects).
2. Webhooks signés.
3. Permissions avancées par tenant + conformité RGPD.

---

## 5) Audit d’impact des modèles (prisme Prisma attendu, transposé ici à Mongo/Mongoose)

> Note: le code actuel est Mongoose. L’équivalent Prisma (Mongo provider) devra refléter ces concepts.

- Nouveau modèle: `Tenant`.
- Impact immédiat sur modèles existants:
  - `Post`: ajout `tenantId`, index tenant.
  - `User`: ajout `tenantId`.
  - `AuditLog`: ajout `tenantId`.
- Impact recommandé (prochaines itérations):
  - `Media`, `Settings`, `Taxonomy`, `Project`, `Service`, `Event`, `Lead`, `Form*`.

### Migrations nécessaires (ordre recommandé)
1. Créer collection `tenants` + seed `default`.
2. Ajouter champ `tenantId` nullable aux collections existantes.
3. Backfill `tenantId` avec tenant `default` sur legacy data.
4. Ajouter index composés par tenant.
5. Basculer endpoints CMS vers filtres tenant-aware.

---

## 6) Compatibilité ascendante

- Conserver routes existantes (`/api/public/brand`, `/api/cms/*`, `/api/auth/*`).
- Résolution tenant implicite vers `default` si aucun contexte tenant.
- Les données legacy restent lisibles via tenant par défaut.
- Nouvelles routes versionnées ajoutées sans rupture (`/api/v1/brand`).

---

## 7) Risques majeurs V4

1. **Risque unicité slug global**: actuellement encore global; à migrer vers unicité par tenant.
2. **Risque sécurité tenant**: besoin de renforcer authz tenant-aware pour rôles/scopes.
3. **Risque dette architecture**: monolithe `server/index.js`; à modulariser (domain/services/repositories).
4. **Risque observabilité**: absence de métriques workers/publication omnicanale.

---

## 8) Backlog priorisé (proposition)

1. Extraire modules backend (`tenant`, `brand`, `posts`, `auth`, `audit`).
2. Implémenter `tenantId` sur settings/media/projets/services/events/taxonomies.
3. Ajouter middleware tenant + tests unitaires/intégration.
4. Ajouter API `/api/v1/posts`, `/api/v1/projects`, `/api/v1/services`, `/api/v1/media`.
5. Ajouter moteur distribution (jobs/logs).
6. Ajouter form builder + leads + consentement.
7. Ajouter dashboards KPI + exports.
8. Ajouter webhooks + signatures HMAC.

