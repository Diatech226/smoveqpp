# Iteration B — Service Route & Detail Contract Convergence

_Date: 2026-03-19_

## Scope delivered

This iteration aligns Services CMS authoring with public navigation/detail behavior while preserving premium service templates.

### 1) Route contract convergence
- Introduced a shared service routing contract (`serviceRouting`) used by:
  - service cards adapters
  - hash route resolver
  - CMS route preview
- Premium overrides are explicit:
  - `design-branding` → `#service-design`
  - `web-development` → `#service-web`
- All other public services resolve to `#service/{routeSlug}` and are handled by a generic detail route.

### 2) Generic CMS-driven service detail page
- Added a generic `ServiceDetailPage` for non-premium services.
- Added `serviceDetailContract` builder to provide safe rendering defaults for:
  - title / short description / overview
  - features fallback
  - process fallback
  - CTA fallback + safe href normalization
  - media/iconLikeAsset fallback
- Unpublished/draft/archived services are not resolved for public detail.

### 3) Premium template preservation with CMS convergence
- `DesignBrandingPage` and `WebDevelopmentPage` remain premium overrides.
- Both now resolve baseline service data through the same published-service lookup used by the generic path.
- Key shared fields are CMS-authoritative where present:
  - title/badge
  - overview
  - feature list
  - process steps
  - primary CTA label/href

### 4) Homepage/services hub navigation coherence
- Homepage service cards now link to service routes instead of static non-click cards.
- Hub/home cards use shared route href contract.
- Card copy now prefers `shortDescription` with `description` fallback.

### 5) CMS integrity UX improvements (non-redesign)
- Services form now validates CTA href format (`#`, `/`, `https://`).
- Route slug field includes explicit public-route preview.
- Services list surfaces public destination per service to reduce routing ambiguity.

## Tests added/updated
- `serviceCatalog.test`:
  - route resolution for premium/non-premium
  - slug normalization safety
  - card description fallback
- `serviceDetailContract.test`:
  - generic detail contract rendering
  - CTA/process/features fallback behavior
  - unpublished service route protection
- `routeResolver.test`:
  - non-premium service detail route resolution
  - empty/invalid service slug fallback to services hub

## Remaining next-step opportunities
- Feed structured feature/process copy (with richer descriptions/icons) from CMS if needed.
- Incrementally reduce static premium-only sections still not CMS-backed (portfolio showcases, tech visual mockups).
