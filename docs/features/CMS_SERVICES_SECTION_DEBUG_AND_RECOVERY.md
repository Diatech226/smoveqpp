# CMS Services Section Debug & Recovery

## Root cause identified

The Services tab was wired, but service collections were handled with an **all-or-nothing validator** in both CMS and public-site repositories:

- `serviceRepository.replaceAll()` required `isServiceArray(...)` to pass for the whole payload.
- If **one** malformed service came from backend/local storage, the entire array was rejected and replaced by `[]`.
- Result: Services section could appear empty/non-functional even when valid services existed, and the public site could drift from CMS expectations.

## Fix summary

### 1) Repository resilience (CMS + public site)

- Service repositories now normalize arrays **entry-by-entry**.
- Malformed entries are dropped safely; valid services remain available.
- Storage reads now accept array-shaped payloads and sanitize each item.

This prevents one bad record from breaking Services list rendering and CRUD workflows.

### 2) Backend route integrity

- Added `SERVICE_ROUTE_SLUG_CONFLICT` guard in API service persistence.
- Two services can no longer share the same public `routeSlug`.

This avoids service detail route collisions and keeps CMS ↔ public site mapping deterministic.

### 3) CMS error feedback

- CMS now maps `SERVICE_ROUTE_SLUG_CONFLICT` to a clear, actionable error message in the Services form.

## Final Services workflow

1. Open **Services** tab (`#cms/services`) from CMS sidebar.
2. Load list from backend; malformed records are ignored without crashing list.
3. Create/edit service via form and save to backend.
4. Change status (`draft` / `published` / `archived`) from list actions.
5. Delete service (role-gated) with backend persistence.
6. Refresh/reload reflects canonical backend state.

## Service data model contract (CMS/public)

Required core fields:

- `id`
- `title`
- `slug`
- `routeSlug`
- `description`
- `icon`
- `color`
- `features[]`
- `status`

Optional fields used by public detail/CTA/media:

- `shortDescription`
- `overviewDescription`
- `processTitle`
- `processSteps[]`
- `ctaTitle`
- `ctaDescription`
- `ctaPrimaryLabel`
- `ctaPrimaryHref`
- `iconLikeAsset`

## Media handling rules

- `iconLikeAsset` may be an absolute URL or `media:<asset-id>` reference.
- CMS form supports assigning selected media from Media Library and previewing saved reference.
- Backend validation rejects dangling media references.

## Save/reload expectations

- Save operations persist to backend `/content/services`.
- Services list refreshes from backend after save/delete/transition.
- Public site services (`/content/public/services`) consume same canonical records and status filtering (`published`).
- Reload should show latest saved values; malformed sibling entries no longer wipe the list.
