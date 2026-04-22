# Service Update Validation Relaxation and Existing-Record Compatibility

## Why this change

Service edits from CMS (especially media-only edits such as `iconLikeAsset`) were failing because backend save logic treated update payloads similarly to strict create payloads.

Older/legacy service records can be missing optional fields or contain older optional-field shapes. Those records should remain editable without forcing complete re-entry.

## Create vs update validation

### Create (`saveService` without existing id)

Create keeps a strict minimum contract:

- required: `id`, `title`, `slug`, `routeSlug`
- required: `description`
- required: `features` with at least one item
- required structural constraints: valid `icon`, `color`, `status`, ownership metadata
- optional fields (SEO/CTA/process/media) validated only when provided

### Update (`saveService` with existing id)

Update uses tolerant partial behavior:

- payload is merged with existing stored record first
- omitted fields are preserved from existing record
- optional legacy gaps do not block update
- media-only updates are supported (for example only sending `id` + `iconLikeAsset`)
- publishability blocker check only runs when transitioning into `published` from a non-published state (not for already-published records receiving metadata/media edits)

## Merge/preserve behavior

`mergeServiceForUpdate(existing, incoming)` applies per-field preservation semantics:

- if field exists in incoming payload, it is used
- if field is omitted, existing value is preserved
- nested `seo` object is merged, not overwritten wholesale
- immutable governance fields are preserved from existing (`createdAt`, `ownerUserId`, `organizationId`)

This prevents accidental data loss and avoids undefined overwrites during partial edits.

## Media-only update flow

When CMS updates only visual/media fields (for example `iconLikeAsset`):

- backend resolves/registers media references as usual
- update validation checks only critical structure and media reference correctness
- missing optional text sections no longer force rejection

## Error message improvements

Validation errors now return explicit field-level diagnostics:

- error code: `SERVICE_VALIDATION_ERROR`
- message includes create/update mode and reason
- `error.details` includes `{ mode, field, message }`

This makes CMS troubleshooting much faster than a generic “invalid payload” response.

## Rendering safety

Public rendering remains safe because:

- critical identifiers/slugs remain required
- icon/color/status contracts remain validated
- create still enforces core content presence (`description`, `features`)
- published-state publishability is still enforced on transition to published
