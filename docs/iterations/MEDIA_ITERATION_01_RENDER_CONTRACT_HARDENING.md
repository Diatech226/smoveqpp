# Media Iteration 01 — Render Contract Hardening

Date: 2026-03-24

## Scope
Iteration 1 focused on public rendering reliability only (no CMS UX redesign, no media-platform redesign).

Goals delivered:
- Ensure blog/project image flows pass a real final image value to `<img src>`.
- Remove dead dependency on `query` props in public image render paths.
- Remove conditional `src` blanking that dropped valid renderable URLs.
- Keep compatibility for both direct URLs and `media:asset-id` references.

## Render paths fixed

### Blog
- Homepage blog cards now use resolved media output as `src` directly.
- Blog list / featured cards now pass `post.image` directly to `ImageWithFallback` `src`.
- Blog detail hero now passes canonical `post.featuredImage` to `src`.

### Projects
- Homepage projects cards now pass `card.mediaSrc` to `src`.
- Projects listing cards now pass `card.mediaSrc` to `src`.
- Project detail hero now passes `projectMedia.src` to `src`.
- Project gallery now passes each `image.src` to `src`.

### Home/About
- Home about image no longer blanks `src` when resolver result is not marked `isMediaAsset`.
- Resolver output `aboutMedia.src` is always used as final `src` candidate.

## Dead-query cleanup

Public rendering call sites no longer rely on `query={...}` for image display.

`ImageWithFallback` now explicitly treats `query` as deprecated and ignores it, which protects against accidental reliance and prevents forwarding the unused prop to the underlying `<img>` element.

## Final `src` assignment pattern

Standardized pattern used in updated paths:
1. Adapter/resolver computes canonical media candidate (`src`, alt, caption/reference metadata).
2. View receives this canonical value.
3. View passes canonical value to `ImageWithFallback src` (no empty-string placeholder when value exists).

This iteration intentionally leaves broader public media hydration redesign for Iteration 2.

## Tests updated

- `src/features/blog/blogContentService.test.ts`
  - direct URL featured image remains renderable in list contract (`post.image`).
  - `media:asset-id` featured image resolves to concrete asset URL in list contract.
  - detail contract resolves media reference to concrete `featuredImage` src.

- `src/features/projects/projectCardAdapter.test.ts`
  - updated to assert canonical `src` fields (`mediaSrc`, `hero.src`, `gallery[].src`).
  - keeps coverage for direct values, media-reference resolution, and fallback behavior.

## Deferred to Iteration 2

- Public media hydration redesign / repository synchronization guarantees.
- Broader contract shape convergence beyond immediate rendering reliability.
- CMS media UX improvements.
