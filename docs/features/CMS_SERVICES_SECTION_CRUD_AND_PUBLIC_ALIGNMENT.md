# CMS Services section CRUD and public rendering alignment

## Public service presentation model (source of truth)

### Public service cards (homepage + services hub)
Service cards render from the shared `Service` model via `selectRenderablePublicServices` and `toRenderableService`.

Render-critical fields:
- `title`
- `shortDescription` (fallback: `description`)
- `icon` (mapped to supported icon set)
- `color` gradient
- `features`
- `status` (`published` only)
- `featured` (sorting priority)
- `routeSlug`/`slug` (card destination)

### Public service detail pages
Generic detail pages render via `buildServiceDetailContract` and published service lookup.

Render-critical fields:
- `title`
- `shortDescription` + `description`
- `overviewDescription`
- `features`
- `processTitle`
- `processSteps`
- CTA block: `ctaTitle`, `ctaDescription`, `ctaPrimaryLabel`, `ctaPrimaryHref`
- `iconLikeAsset` as detail hero media fallback
- `routeSlug` as canonical detail lookup key

Status rule:
- only `published` services are publicly discoverable and routable.

## CMS services management model

The CMS Services section now supports a stable list + editor workflow:

- List view with:
  - count, loading/empty/error states,
  - refresh action,
  - quick status actions (publish/archive/return to draft),
  - edit action,
  - delete action.
- Editor view with grouped fields aligned to public rendering:
  - identity/routing,
  - card/detail content,
  - media + CTA,
  - process + publication.

## Create / edit / delete / archive workflow

### Create
1. Click **Nouveau service**.
2. Fill required fields (`title`, `description`, `icon`, `color`, `features`; route slug auto-derived if empty).
3. Save (persisted through backend API).
4. List refreshes from backend source.

### Edit / update
1. Click **Modifier** from list.
2. Update fields.
3. Save.
4. Updated entity is reloaded from backend and displayed immediately.

### Archive / publish transitions
- `draft -> published` via quick action.
- `published -> archived` via quick action.
- `archived -> draft` via quick action.

Transition operations persist through `saveService` with updated status and then reload the authoritative backend list.

### Delete
- Admin-only destructive delete with explicit confirmation.
- On success, list reloads from backend and any open editor bound to deleted service is reset.

## Media handling rules for services

Service visual field `iconLikeAsset` now supports:
- Media Library selection (`media:<asset-id>`),
- direct URL values,
- in-form preview (image/video/missing-state).

Behavior:
- `iconLikeAsset` is validated by CMS and backend.
- Public detail hero resolves from this field first; when missing/invalid, safe fallback visuals apply.

## CMS ↔ API ↔ public synchronization

Canonical flow:
1. CMS writes through backend `/api/v1/content/services` endpoints.
2. Backend normalizes and validates canonical `Service` entities.
3. CMS reloads service list from backend after every mutation.
4. Public pages consume `/public/services` and render only published entries.

This ensures the same service data powers CMS list/editor and public card/detail rendering.

## Validation and reliability safeguards

- CMS service form enforces slug/route/icon/color/CTA/media contracts.
- Additional publish-time checks in CMS ensure required public fields are present.
- Backend remains authoritative for final validation and persistence.
- Save/delete/status errors now show mapped actionable messages instead of generic failures.
