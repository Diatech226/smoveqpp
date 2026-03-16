# Iteration 04 — Media Library, Asset Unification, and CMS Content Authority

## What shipped

### 1) Unified media reference contract for Blog + Projects
- Introduced a shared media reference utility (`media:asset-id`) with:
  - parsing/formatting helpers,
  - existence validation against repository assets,
  - reusable safe resolver that can return asset URL or fallback query.
- Blog and Project media adapters now rely on the same underlying resolver.

### 2) Harmonized Blog/Project adapter behavior
- Blog featured/social image and Project featured/gallery references now resolve through the same contract semantics.
- Project detail gallery rendering now resolves `media:*` references before rendering, reducing brittle raw string assumptions.

### 3) CMS picker consistency improvements
- Blog + Project forms now clearly communicate the same selector contract (`media:asset-id`).
- Selection actions now populate references through the unified helper.

### 4) Media library hardening
- Media cards now show reference usage count.
- Media detail panel now displays active references (Blog/Project/Home content).
- Client-side delete guard added to block deletion when local usage is detected, reducing accidental broken references.

### 5) Validation hardening
- Blog repository now validates:
  - featured image,
  - SEO social image,
  - image array entries.
- Project repository now validates:
  - featured/gallery references,
  - external/case-study URLs.
- Backend service now validates blog SEO social image media references.

### 6) CMS authority improvements
- Project category options now derive from published repository data (`Tous` + live categories) instead of static seed categories, reducing static/CMS drift.

## Canonical media decision (Iteration 04)
- Canonical cross-domain reference format remains: `media:<asset-id>`.
- Canonical resolving behavior:
  1. If `media:*` and asset exists → resolve to asset URL + media alt/caption metadata.
  2. If non-empty non-reference string → use as direct query/URL fallback.
  3. If empty → use domain fallback query (blog/project).

## Remaining for next iteration
- Introduce a dedicated CMS media picker modal with preview thumbnails and pagination.
- Add first-class media usage API in backend responses (currently calculated client-side + backend delete guard).
- Add bulk media operations and richer metadata editing (alt/caption/tags lifecycle).
