# SERVICE `iconLikeAsset` Validation Compatibility Fix

## Root cause

`iconLikeAsset` was validated as an optional media/url/text field, but update requests could still fail in real CMS edit flows when legacy values were resent unchanged.

Two concrete incompatibilities were identified in the save pipeline:

1. **Update validation only skipped optional checks when a field was omitted**. If CMS sent back unchanged legacy values (for example stale `media:<id>` references), backend still revalidated and rejected them.
2. **Legacy token aliases** such as `asset:<id>` / `media/<id>` were not normalized into canonical `media:<id>` before validation.

## Canonical accepted shapes

`iconLikeAsset` now supports and normalizes to these canonical forms:

- `media:<asset-id>` (preferred)
- absolute `http(s)://...` URL
- inline text / relative path values used by existing rendering flows

Additionally, the backend normalizes known legacy aliases:

- `asset:<id>` -> `media:<id>`
- `media/<id>` -> `media:<id>`
- `media://<id>` -> `media:<id>`
- `./uploads/...` -> `uploads/...`

## Create vs update behavior

### Create

- `iconLikeAsset` is still validated when provided.
- Truly invalid malformed values continue to fail.

### Update

- If optional `iconLikeAsset` is omitted, existing stored value is preserved (unchanged behavior).
- If update payload resends an unchanged legacy value, backend treats it as legacy-compatible and does not reject unrelated edits.
- If a new/changed invalid value is provided, backend still rejects it.

## CMS serialization expectation

CMS edit flow now avoids sending `iconLikeAsset` when the user has not changed it.

This prevents unnecessary backend validation failures caused by round-tripping unchanged legacy values and keeps updates focused on modified fields.

## Error reporting improvement

When `iconLikeAsset` is still invalid after normalization, backend validation now includes a compact received-shape hint (`media-reference`, `url`, `text-or-relative-path`, `unknown-scheme`, `empty`) to speed up debugging.
