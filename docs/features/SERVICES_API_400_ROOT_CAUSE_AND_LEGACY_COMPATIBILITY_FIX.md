# Services API 400 Root Cause and Legacy Compatibility Fix

## Date

April 23, 2026

## Exact 400 root cause

`POST /api/v1/content/services` rejected update payloads for existing records when the stored record contained **legacy optional field values** (for example stale `iconLikeAsset` / `seo.socialImage` media references).

The update flow merged incoming payload with the stored record and then validated the merged object. Optional fields inherited from legacy data were validated as if they were newly submitted, causing `SERVICE_VALIDATION_ERROR` 400 responses even for minor unrelated edits.

## Why this blocked CMS Services

- CMS often submits minor updates (status/copy/media tweaks), not a full rebuilt canonical service object.
- Existing stored records could include old optional values that are not critical for rendering.
- Backend rejected these updates because optional fields were over-validated in update mode.

## Create vs update validation rules after fix

### Create

Create remains strict and enforces required service contract:

- `id`, `title`, `slug`, `routeSlug`
- `description`
- `features` (at least one)
- valid publish/status and structural constraints

### Update

Update is now legacy-compatible:

- partial payloads allowed
- omitted fields preserved from existing record
- optional fields are validated when explicitly provided in the update payload
- legacy optional values already present on stored records no longer block unrelated edits

## Legacy compatibility strategy

1. Locate existing service from repository state (not only filtered “strict” list) so update path is correctly selected.
2. Merge incoming payload with existing values for omitted fields.
3. Validate with update-aware optional-field behavior:
   - strict when caller explicitly sends optional fields
   - tolerant for legacy optional values not touched in this request

## CMS serialization expectations

- Edit payloads should remain partial and omit empty optional fields.
- Avoid sending blank/null optional fields unless user explicitly intends to clear/replace values.
- Keep stable identifiers (`id`, `slug`, `routeSlug`) in payload.

## Critical vs optional service fields

### Critical (must remain valid)

- `id`, `title`, `slug`, `routeSlug`
- `status`
- ownership/org metadata
- on create: `description`, `features`

### Optional (tolerant for legacy on update when omitted)

- `iconLikeAsset`
- `seo.socialImage`
- CTA/process descriptive blocks
- other non-blocking presentation metadata

## Error reporting improvements

Route `POST /api/v1/content/services` now forwards backend validation `details` in the API error body so CMS can show precise field-level reasons when a true validation error occurs.
