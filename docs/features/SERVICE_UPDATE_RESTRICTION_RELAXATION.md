# Service update restriction relaxation

## Goal

Allow CMS edits on existing/legacy services without forcing strict create-time validation, while preserving critical guarantees (`id`, `title`, `slug`, `routeSlug`, ownership, status).

## Create vs update validation

- **Create (`mode=create`) remains strict**:
  - requires `description`
  - requires non-empty `features`
  - requires supported `icon`
  - requires valid gradient `color`
- **Update (`mode=update`) is intentionally tolerant**:
  - accepts partial payloads
  - keeps strict checks on critical routing identity fields (`id`, `title`, `slug`, `routeSlug`)
  - no longer rejects legacy services for deprecated `icon`/`color` values
  - still validates structural types when optional fields are provided

## Existing value preservation strategy

- Backend update path merges incoming payload over stored service (`mergeServiceForUpdate`).
- CMS update payload now omits empty optional fields/arrays to avoid accidental destructive writes.
- Result: editing one detail no longer wipes unrelated existing values.

## Legacy compatibility strategy

- Service collection listing now uses tolerant update validation compatibility instead of strict create validation.
- Legacy services that are already renderable can remain visible/editable in CMS and save successfully.
- Public publishing blockers still apply when transitioning to published status.

## CMS serialization hardening

- Validation in edit mode is relaxed versus create mode.
- Update payload builder sends only meaningful fields and skips empty optional/array values.
- Prevents empty `features`/`processSteps` from unintentionally replacing good stored values.

## Error reporting improvements

- Backend service validation rejection now includes the failing field path in the message, e.g.:
  - `Service update rejected (routeSlug: routeSlug is required and must be a valid slug)`
- CMS surfaces backend validation detail message for faster debugging.
