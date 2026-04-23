# Service update restriction relaxation

## Why

Legacy services already published on the public website could fail CMS saves with `SERVICE_VALIDATION_ERROR` during minor edits, because update requests were validated too closely to create-time constraints.

## Create vs update validation

- **Create (`mode=create`) remains strict**
  - Required: `id`, `title`, `slug`, `routeSlug`, `description`, `features`, valid `icon`, valid `color`, ownership/status metadata.
- **Update (`mode=update`) is now tolerant**
  - Required: critical identifiers/routing fields and title integrity (`id`, `title`, `slug`, `routeSlug`).
  - Optional compatibility fields (`icon`, `color`, descriptive/CTA/process fields) no longer block updates when legacy values are outside current strict presets.

## Existing-value preservation rules

`mergeServiceForUpdate` now prevents accidental data loss:

- If update payload omits a field, keep stored value.
- If update payload sends blank string / empty array for non-critical optional fields, keep stored value.
- Enables single-field edits (e.g. only `overviewDescription`) without forcing full object reconstruction.

## Legacy compatibility strategy

- Published legacy services with old icon tokens or old color formats can still be updated.
- Public rendering remains safe because frontend already falls back for unknown icon/color values.
- Publishability guardrails still apply when transitioning into published state.

## CMS serialization safety rules

CMS service payload generation now differs by mode:

- **Create payload:** full strict payload with required fields.
- **Edit payload:** sparse payload that excludes empty optional fields to avoid wiping valid stored data.

## Error reporting improvements

- Backend keeps detailed `field` + `message` validation details in `SERVICE_VALIDATION_ERROR`.
- CMS now surfaces these details in the save error banner (blocking field + reason), instead of only a generic message.
