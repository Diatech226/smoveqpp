# HERO Slides — Analysis and End-to-End Implementation

## Current-state analysis (before this patch)

- The CMS already exposed a Hero background slider editor and allowed adding/removing items, assigning media references, uploading images, and saving through `/page-content`.
- Backend normalization/persistence already handled `home.heroBackgroundItems` and persisted them to content state.
- Public site rendering (`Hero3DEnhanced` + `resolveHeroBackgroundItems`) already rotated multiple slides and resolved media references.
- Gaps found:
  - slide model missed explicit ordering and per-slide CTA fields,
  - slide order changes in CMS did not persist as canonical sort metadata,
  - slide CTA links were not modeled/validated end-to-end,
  - document assets could be attached indirectly and were not explicitly guarded in hero rendering semantics.

## Final Hero slide model

Each `heroBackgroundItems[]` entry now supports:

- `id: string`
- `sortOrder: number`
- `label: string`
- `title: string`
- `description: string`
- `ctaLabel: string`
- `ctaHref: string`
- `type: "image" | "video"`
- `media`, `desktopMedia`, `tabletMedia`, `mobileMedia`, `videoMedia`
- `alt`, `overlayColor`, `overlayOpacity`, `position`, `size`, `enableParallax`, `enable3DEffects`

This is now normalized in CMS local repository, backend persistence, and site repository.

## CMS editing flow

- Add slide creates a complete canonical item with generated `id`, `sortOrder`, and default visual properties.
- CMS editor now supports editing:
  - slide title/description,
  - slide CTA label + CTA href,
  - responsive media refs,
  - visual options and per-slide effects.
- Reorder/remove actions now reindex and persist `sortOrder`.
- Document asset warning appears when a document is assigned as primary hero media.
- Save validation now also validates per-slide CTA hrefs.

## Backend save/read flow

- `normalizeHomePageContent` now normalizes `sortOrder`, `ctaLabel`, and `ctaHref` for hero items.
- `validateHomePageContent` now enforces these fields and validates optional slide CTA hrefs with content href rules.
- Existing media reference registration for hero items remains intact for usage tracking and guardrails.

## Public rendering flow

- Hero background resolver now:
  - carries `sortOrder` + slide CTA fields,
  - sorts slides by canonical `sortOrder`,
  - guards against document media as renderable image backgrounds,
  - preserves fallback behavior for unresolved/archived references.
- Public Hero overlay now supports per-slide CTA rendering when configured.

## Media/document handling rules

- Hero backgrounds are render-oriented and expect image/video media.
- If a document asset is referenced as background media, it is marked non-valid for hero background rendering.
- CMS warns editors when a document is attached as primary media for a slide.
- Upload flow still stores assets in media library and references canonical `media:<id>`.

## Fallback behavior

- Missing or archived media references continue to resolve to deterministic visual fallback placeholders.
- Invalid slide media does not crash rendering; slide remains safely handled.
- If no valid hero slide is configured, hero keeps premium default visual layer behavior.
