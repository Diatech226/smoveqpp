# Media Library Canonical Image System

## Canonical model

The Media Library is the canonical registry for managed image/media assets.

- Content entities (blog, project, service, settings, homepage) should reference media assets through `media:<asset-id>` values.
- Raw URL/image strings are still accepted for backward compatibility, but save flows now auto-register eligible media links and normalize references to `media:` records.

## Auto-registration flows

Auto-registration runs inside `ContentService` save flows:

- `saveBlogPost` registers featured, card, cover, social and gallery image sources.
- `saveProject` registers card, hero, cover, social and gallery image sources.
- `saveService` registers icon-like and social image sources.
- `savePageContent` registers homepage about image and hero background media items.
- `saveSettings` registers brand media (logo, dark logo, favicon, default social image).

Matching/deduplication strategy:

1. Exact URL/source match.
2. `metadata.originalSourceUrl` match.
3. Deterministic checksum (`metadata.autoRegisterChecksum`) match.

This prevents duplicate auto-created records for repeated content saves.

## Variant/resolution model

Media files now support a first-class `variants` object with optional keys:

- `thumbnail`
- `card`
- `hero`
- `social`
- `original`

Each variant supports:

- `url`
- optional `width`
- optional `height`
- optional `mimeType`

When explicit variants are not provided, normalization populates sensible defaults from `url/thumbnailUrl`.

## Public rendering rules

Public render helpers should resolve a target variant by context:

- Blog cards and list images -> `card`
- Blog/social metadata -> `social`
- Project cards -> `card`
- Project hero/detail -> `hero`
- Project gallery -> `card` (safe default)

If a requested variant is missing, fallback order is:

1. requested variant
2. `original`
3. base `url`
4. deterministic SVG fallback placeholder

No public image component should render unresolved `media:` tokens directly.

## Usage tracking and archive safety

Existing usage tracking remains the authoritative source:

- `findMediaReferences(mediaId)` enumerates where-used references across blog/projects/services/home/settings.
- `getMediaUsageImpact(mediaId)` drives archive safety decisions.
- Archive operations remain blocked when critical/published/system references are present.

## Compatibility and drift prevention

- Existing legacy content with direct URL fields remains readable.
- New saves are normalized toward media references to reduce drift.
- Health diagnostics continue to report unresolved references and legacy field usage.
- Auto-registration metadata (`autoRegisteredByFlow`, `originalSourceUrl`) provides traceability for CMS operators.

## Future extension path

The system is prepared for optional generated derivatives:

- Background jobs can populate `variants.<key>` with optimized generated files.
- Existing render helpers already consume variants by context without requiring schema redesign.
- Admin Media Library UI can expose variant inventory and completeness checks per asset.
