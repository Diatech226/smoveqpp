# Iteration 4 — Media Lifecycle Governance & Production Observability (Execution)

## Scope implemented
- API hardening in `apps/api` for media lifecycle governance, content health diagnostics, and release readiness checks.
- CMS observability improvements in `apps/cms` readiness summaries.
- Site runtime resilience/observability improvements in `apps/site` media resolver.

## Media lifecycle governance rules
1. **Archive is now policy-driven (not just action-driven)**:
   - Archive is blocked when an asset is referenced by **published** content or **system/global** surfaces (settings, global brand assets).
   - Archive remains allowed for draft/review-only references so editorial flow is not over-blocked.
2. **Usage impact is explicit before risky operations**:
   - New API impact contract: media usage totals, critical usages, protected usages, and archive decision.
3. **Restore workflow exists**:
   - Archived assets can be restored in-place with metadata preserved.

## Critical vs non-critical media expectations
- Critical references are explicitly categorized for governance checks:
  - Blog: featured/card/cover roles.
  - Project: card/hero/cover + legacy featured/main mapped equivalents.
  - Service: icon-like asset.
  - Settings: logo, dark logo, favicon, default social image.
- Non-critical references (e.g. gallery slots) remain warnings for readiness, not hard blockers.

## Diagnostics and readiness signals added
- Sync diagnostics now include:
  - unresolved media references (existing)
  - unresolved **critical** count
  - unresolved **published-critical** count
- Health summary now includes:
  - unresolved media distribution by status (`published`, `draft`, `inReview`, `archived`, `system`)
  - explicit `releaseReadinessChecks` list with check id/level/status/message/timestamp

## Release-safety checks introduced
The backend now emits automatable checks in health output:
1. Published critical blog/project media resolved.
2. Published project gallery references resolved (warning-level).
3. Published essential media present.
4. Published SEO completeness.
5. Service routing consistency (valid + collision-free).
6. Global media reference resolve rate.

These checks are machine-readable and suitable for CI/deploy preflight validation.

## Public rendering resilience improvements
- Site media resolver logs once-per-reference when fallback media is applied for:
  - archived media references
  - missing media references
  - empty media references
- Rendering continues gracefully with deterministic fallback image, while increasing operator observability via structured warnings.

## Tests updated
- API service tests now cover:
  - archive blocking for published critical references
  - archive allowance for non-published-only references
  - restore flow
  - presence of release readiness checks in health output
- CMS readiness derivation tests now include failed release-check aggregation.

## Remaining future work
- Surface `media/:id/impact` directly in CMS Media details panel for richer in-UI decision cards.
- Add CI script that fails build on selected blocker-level `releaseReadinessChecks`.
- Extend project/blog/site E2E tests to validate fallback observability events in browser runtime logs.
