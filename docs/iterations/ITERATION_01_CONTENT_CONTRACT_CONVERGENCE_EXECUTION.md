# Iteration 1 — Content Contract Convergence Execution

## Canonical contract layer introduced

A single shared contract module now provides canonical content primitives for CMS, site, and API:

- `shared/contracts/contentContracts.js`
  - slug normalization/validation
  - URL/content href validation
  - media reference parsing + `media:asset-id` utilities
  - reusable string-array normalization
- `shared/contracts/contentContracts.d.ts`
  - shared TS typing contract for CMS/site imports

### Active consumers

- API: `apps/api/server/utils/contentContracts.js` now re-exports the shared canonical module.
- Site: `apps/site/src/shared/contentContracts.ts` now re-exports the shared canonical module.
- CMS: `apps/cms/src/shared/contentContracts.ts` now re-exports the shared canonical module.

This removes parallel implementations and ensures normalization logic converges across write (CMS), persistence (API), and render (site) paths.

## Canonical domain type foundation for CMS + site

`shared/contracts/contentSchemas.ts` is now the single source for CMS/site domain type guards and interfaces (blog, media, project, service).

- Site local domain schema file now re-exports from shared canonical schema.
- CMS local domain schema file now re-exports from shared canonical schema.

## Duplicate logic removed / redirected

### Removed
- Duplicated content contract helpers in:
  - `apps/site/src/shared/contentContracts.ts`
  - `apps/cms/src/shared/contentContracts.ts`
  - `apps/api/server/utils/contentContracts.js`

### Redirected to canonical
- All above now route to `shared/contracts/contentContracts.js`.
- CMS + site content schema definitions now route to `shared/contracts/contentSchemas.ts`.

### Legacy compatibility intentionally retained
- Existing media fallback behavior (deterministic SVG fallback for unresolved/archived references) remains intact.
- Existing support for direct URL media fields and legacy text-like image values remains intact via `allowInlineText` contract mode.
- Existing API content service compatibility mapping remains unchanged, but now runs on shared contract helpers.

## Normalization convergence changes

- Slug format checks in editorial workflows now use shared canonical `isValidSlug`:
  - CMS dashboard blog/project form validation
  - Site blog editorial contract validation

This removes local regex drift and keeps a deterministic slug contract.

## Media contract foundation impact

- `media:asset-id` contract is now shared centrally for all three applications.
- Canonical media reference checks and ID extraction run through one module.
- Render paths continue using canonical media resolvers that suppress unresolved media tokens from `src` output (fallback URL is emitted instead).

## Drift-reduction outcome

- CMS write-layer helpers, API normalization helpers, and site read/render helpers now depend on the same contract primitive implementation.
- Schema/guard drift risk between site and CMS is reduced by replacing duplicated domain schema files with shared re-exports.

## Remaining follow-up for future iterations

- Consolidate duplicated repository adapters (`blogRepository`, `projectRepository`, `serviceRepository`) between CMS/site into shared domain adapters.
- Consolidate duplicated media resolver modules between CMS/site into a shared resolver package.
- Migrate `contentService` domain normalizers into domain-specific shared modules (blog/project/service/page-content contracts) for finer-grained governance.
