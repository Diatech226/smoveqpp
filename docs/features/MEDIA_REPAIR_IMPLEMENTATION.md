# MEDIA REPAIR IMPLEMENTATION

## Canonical media format
Canonical asset object:
- id, type, url, publicPath, filename, mimeType, alt, caption.

Canonical persisted references:
- `media:<id>`
- absolute URL (http/https)

Disallowed persisted values:
- raw text, blob:, filename-only, local frontend paths.

## Resolver rules
Unified in API/CMS/site:
1. `media:<id>` -> lookup active media file.
2. plain id -> normalized to `media:<id>`.
3. `/uploads/...` or `uploads/...` -> absolute API URL.
4. absolute URL kept.
5. unresolved => empty string + dev warning.

## Migration rules
Run:
- `node scripts/migrate-media-contract.js`

It scans blog/projects/services/settings/page-content hero items and outputs:
- migrated refs
- unresolved refs
- inactive/invalid refs

## CMS picker usage
Use `CMSMediaPicker` for form fields to enforce persisted `media:<id>` and reliable preview.

## Hero rendering flow
CMS stores hero background entries with media refs. Site resolves refs before render and uses resolved URL for `backgroundImage`.

## Services flow
`iconLikeAsset` and related media aliases are normalized to canonical refs; CMS uses picker + preview.

## Settings/logo flow
Brand media (`logo`, `logoDark`, `favicon`, `defaultSocialImage`) normalized and resolved before runtime injection.

## Validation/debugging
- Dev resolver warnings for unresolved references.
- Migration report identifies broken refs.
