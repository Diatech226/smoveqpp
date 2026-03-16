# Iteration 01 — Media role framework and contract hardening

## Delivered in this iteration

### Canonical media roles (M1)
- **Projects** now normalize toward explicit media roles:
  - `mediaRoles.cardImage`
  - `mediaRoles.heroImage`
  - `mediaRoles.galleryImages[]`
  - Legacy `featuredImage`/`mainImage` are still accepted and auto-normalized.
- **Blog** now carries explicit media role metadata:
  - `mediaRoles.featuredImage`
  - `mediaRoles.socialImage`
  - Fallback remains backward compatible with existing `seo.socialImage` + `featuredImage`.
- **Services** baseline media semantics now include:
  - `icon` (enum icon key)
  - optional `iconLikeAsset` for future CMS-governed media icon usage.

### Shared contract hardening (X1)
- Required-for-render contracts were made explicit through normalization and validator alignment:
  - Projects: title/slug/summary fallback, card image + hero + gallery fallback.
  - Blog: title/slug/excerpt fallback, featured image required for publishability, social image fallback to featured.
  - Services: title/slug/routeSlug/description/icon/color/features baseline validation.
- CMS payload mapping now saves media-role data where available.

### Projects baseline (P1)
- Project card and detail media now derive from one normalized role contract.
- Legacy payloads continue to render through compatibility fallbacks.
- `links.caseStudy`/`links.live` remain optional but persisted safely when provided.

### Blog baseline (B1)
- `featuredImage` and `socialImage` are now explicitly represented in canonical and stored contracts.
- Blog entries remain list-render safe with deterministic media fallback behavior.

### Services route integrity baseline (S1)
- Added `routeSlug` contract for services.
- Added route resolver to keep known service slugs mapped to valid service detail routes.
- Unknown service route slugs degrade safely to anchored in-page hash targets.

## Remaining for next iteration
- Full settings media roles (`brandLogo`, `favicon`, etc.)
- Service-detail pages fully CMS-driven per service type
- Full blog slug-detail SEO routing and per-post canonical URLs
- Media lifecycle governance (replace/version/archive workflows)
