# Media Library Integration — Analysis & Implementation Plan

## Iteration 4 update (2026-03-24)

Iteration 4 is implemented with **contract governance and automated QA** centered on published renderability risk:

- Added regression-focused media contract tests for Blog and Projects public render paths (direct URL + `media:asset-id` + deterministic unresolved fallback behavior).
- Added project detail/media-role coverage for hero and gallery resolution (including ordered gallery resolution and unresolved safety guarantees).
- Strengthened `contentService` health diagnostics to expose **published critical media risk** with explicit breakdown:
  - unresolved published blog card media,
  - unresolved published project card media,
  - unresolved published project hero media,
  - unresolved published project gallery media,
  - archived assets still referenced by published content.
- Hardened readiness rules to validate canonical render sources instead of relying on legacy-only fields (blog featured media + project card/hero canonical references).
- Added a CI-friendly hook `npm run test:media-contract` that runs high-value media contract + health summary regression tests.
- Added Iteration 4 implementation notes in `docs/iterations/MEDIA_ITERATION_04_CONTRACT_GOVERNANCE_AND_AUTOMATED_QA.md`.

## Iteration 3 update (2026-03-24)

Iteration 3 is implemented with **CMS parity previews** focused on editor confidence:

- Media Library cards now show real thumbnails for image assets (`thumbnailUrl` → `url` fallback) and a safe fallback tile for non-image/missing preview states.
- Media detail panel now includes a first-class visual preview block driven by the same runtime resolver path (`resolveAssetReference`) used by public rendering.
- Blog editor now renders explicit featured/social preview cards with resolver/source state labels (resolved vs non-résolu, media reference vs direct URL).
- Project editor now renders explicit role previews (card, hero, social) plus ordered gallery previews using the current textarea order.
- CMS preview state is surfaced consistently (`Résolu`, `Non résolu`, `Manquant`, `Référence média`, `URL directe`) so unresolved/archived-or-missing references are visible pre-publish.

### Iteration 3 parity strategy

To avoid CMS/public mismatch, preview computation now runs through a shared CMS preview utility that wraps `resolveAssetReference` rather than introducing an alternate resolver.

This keeps parity with Iteration 2 public runtime behavior while adding editor-facing status semantics.

### Deferred to Iteration 4

- Full metadata editing workflows and richer DAM governance flows.
- Archive/restore browser UX.
- Cross-section preview parity for additional domains beyond media/blog/projects.

## Iteration 2 update (2026-03-24)

Iteration 2 is implemented with an authoritative **public media hydration** strategy:

- Added `GET /api/v1/content/public/media` (and compatibility via `/api/content/public/media`) to expose active media assets publicly.
- Added frontend public media hydration before Blog and Project public adapters resolve `media:asset-id` values.
- Added deterministic resolver fallback for unresolved media references so public render never emits `img src="media:..."`.

### Why this strategy

This codebase already resolves media references in frontend adapters (`resolveAssetReference`) and already consumes public content via remote endpoints with local fallback. The minimal reliable change was to ensure the media repository is hydrated from an authoritative public endpoint before those adapters execute.

Benefits:
- no stored-shape migration required (`media:asset-id` remains canonical)
- direct URL compatibility preserved
- low contract churn versus server-enriching every blog/project response shape
- deterministic cold-session/hard-refresh behavior

### Iteration 2 scope delivered

- Public media endpoint added.
- Public media hydration utility introduced and wired into Blog list/detail and Projects list/home/detail remote flows.
- Resolver hardened to avoid raw unresolved media references in rendered `src` values.
- Behavior tests expanded for cold-session media hydration and unresolved fallback safety.

### Deferred to Iteration 3

- Media governance/reporting enhancements beyond runtime resolution reliability.
- Additional cross-domain consumers (settings/services) can adopt the same hydration hook as needed.
