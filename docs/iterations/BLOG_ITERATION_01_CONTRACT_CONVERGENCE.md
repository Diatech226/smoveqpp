# Blog Iteration 01 — Contract Convergence

## Scope delivered
- List/detail content source convergence.
- Deterministic slug resolution.
- Publishability parity across save + transition paths.
- Unified featured image resolution across public blog surfaces.
- CMS readiness messaging aligned with backend publishability rules.

## Unified list/detail contract
- `GET /content/public/blog` remains authoritative for public listing.
- Added `GET /content/public/blog/:slug` for detail resolution from the same authority domain.
- Frontend detail now resolves from this dedicated endpoint first, and falls back to local repository only when remote is unavailable.

## Slug resolution precedence
- Canonical and compatibility-safe lookup is now:
  1. canonical slug (`seo.canonicalSlug`)
  2. normalized slug (`slug`)
  3. normalized id (`id`) for legacy compatibility

## Publishability parity decisions
- Backend already enforced publishability at publish transition.
- Save flow parity was hardened through explicit CMS validation/readiness feedback tied to the same required fields.
- Error mapping now surfaces backend publishability failures with explicit user guidance.

## Featured image rendering contract
- Canonical image resolution for blog entries now prioritizes:
  1. `mediaRoles.featuredImage`
  2. `mediaRoles.coverImage`
  3. `mediaRoles.cardImage`
  4. `featuredImage`
- Public homepage cards, list cards, featured block, and detail hero all consume this canonical output path.

## Remaining for Iteration 2
- richer editorial quality gates beyond core publishability
- deeper media governance policy UX
- stronger SEO lifecycle guidance and diagnostics
