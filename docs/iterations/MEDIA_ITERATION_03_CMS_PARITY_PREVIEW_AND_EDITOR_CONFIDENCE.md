# Media Iteration 03 — CMS Parity Preview and Editor Confidence

Date: 2026-03-24

## Delivered

### 1) Media Library visual confirmation
- Added real thumbnails to CMS Media Library cards for image assets (`thumbnailUrl` first, then `url`).
- Added explicit non-image/missing preview fallback tiles to avoid broken image rendering.

### 2) Media detail panel preview
- Added a dedicated preview block in the media detail panel.
- Preview now uses the same resolver contract as public rendering (`resolveAssetReference`) via `resolveCmsPreviewReference`.
- Kept metadata, usage/governance, and danger-zone sections in place while clarifying preview state.

### 3) Blog image parity previews
- Added preview cards for:
  - Featured image (card + detail hero)
  - Social share image
- Added source and state indicators:
  - `Référence média` / `URL directe`
  - `Résolu` / `Non résolu` / `Manquant`
- Works with both direct URLs and `media:asset-id` without requiring save.

### 4) Project image parity previews
- Added explicit preview cards for:
  - Card image
  - Hero image
  - Social/share image
- Added ordered gallery preview cards directly from the form textarea line order.
- Works with both direct URLs and `media:asset-id` without requiring save.

## Resolver parity approach

CMS preview behavior now composes the existing runtime resolver used by public adapters:
- `resolveAssetReference` remains the source of truth for reference resolution.
- `resolveCmsPreviewReference` only adds UI-facing source/state labels; it does not fork resolution semantics.

## State indicator semantics

- **Résolu**: preview source resolves to a render-safe URL/image payload.
- **Non résolu**: reference cannot currently resolve (e.g., missing/archived media id or invalid URL payload).
- **Manquant**: no media source is provided.
- **Référence média**: source entered as `media:asset-id`.
- **URL directe**: source entered as direct URL.

## Remaining for Iteration 4

- richer media lifecycle operations (archive/restore browsing)
- metadata authoring workflows and policy gates
- broader CMS-wide media parity outside media/blog/projects sections
