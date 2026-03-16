# Iteration 02 — Workflow Governance and Detail Contracts

## Scope delivered

### 1) Project lifecycle governance

- Added in-review lifecycle status support in schema + repository + backend validation.
- Added backend transition endpoint for project statuses.
- Added CMS transition actions (submit review, publish, archive) with role-aware restrictions and feedback.
- Added publish-readiness checks for projects (title, slug, image, minimum summary/description length).
- Added review metadata baseline (`reviewedAt`, `reviewedBy`) on review/publish transitions.

### 2) Blog detail contract completion

- Added canonical blog detail contract for slug-resolved detail rendering.
- Added hash-route support for blog detail URLs (`#blog/<slug>`), slug normalized.
- Added new public blog detail page rendering contract with safe metadata fallbacks.
- Preserved existing blog list layout and filtering behavior.

### 3) Services static-to-CMS migration baseline

- Service detail pages now hydrate CMS service data for:
  - overview copy,
  - key feature list,
  - CTA title/description/label/href.
- Added optional service content fields to service model normalization path.
- Maintained previous visual layout and fallback to static text when CMS fields are missing.

### 4) Route integrity hardening

- Blog detail slug normalization in route resolver.
- Service slug route resolution (`#service/<slug>`) with deterministic mapping for known detail pages.
- Service catalog fallback route now uses coherent slug route patterns.

## Remaining for next iteration

- Full dynamic detail templates for all service slugs beyond current dedicated pages.
- Deeper collision checks across domains (cross-entity slug conflict guardrail).
- Expanded editorial audit trail UI surfacing for review metadata.
