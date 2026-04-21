# HERO_FIRST_LOAD_AND_PUBLIC_SITE_UNIFICATION

## Summary
This change addresses the Hero first-load regression by hardening homepage hydration, fixing autoplay normalization defaults, and removing data-shape drift between CMS and public repositories.

## Root causes
1. **Public Hero could render with unresolved media references on first load**.
   - Hero slides reference media through `media:*` IDs.
   - When those IDs were unresolved, the fallback SVG data URI used raw XML characters, which is brittle in CSS `background-image` and could result in invisible slide backgrounds.
2. **Repository normalization drift could disable autoplay unintentionally**.
   - `heroBackgroundAutoplay` was coerced with `Boolean(value)`, so missing/legacy payload fields became `false` instead of using canonical default.
3. **Frontend repository normalization dropped valid video-only slides**.
   - Site/CMS normalization required image media fields, while backend normalization accepts `videoMedia` for `type: "video"` slides.
   - This created inconsistent behavior across public runtime and CMS/runtime round-trips.

## Fixes implemented

### 1) First-load Hero visibility fix
- Fallback media data URIs are now safely encoded in `resolveCanonicalMedia`.
- Missing references now resolve to a deterministic encoded image URL that remains renderable in CSS backgrounds.

### 2) Autoplay reliability fix
- Site/CMS repositories now preserve default autoplay behavior (`defaultHomePageContent.heroBackgroundAutoplay`) when fields are absent.
- This prevents legacy payloads from silently disabling Hero auto-slide.

### 3) Canonical public data-shape unification
- Site and CMS repository normalization now match backend rules for hero slides:
  - `type: "video"` entries are preserved when `videoMedia` is present,
  - primary media derivation is aligned across runtime boundaries.
- This removes a competing normalization branch where public runtime could discard slides that backend/CMS considered valid.

## CMS-independent behavior
- Public Hero no longer depends on a CMS round-trip to make missing-reference slides visible.
- Public initialization remains authoritative from public endpoints, with stable fallback rendering when media hydration is delayed.

## Tests updated
- Added site repository test validating:
  - default autoplay fallback stays enabled,
  - video-only hero slide persistence.
- Added CMS repository parity test for the same video/autoplay normalization behavior.
- Added media resolver test asserting fallback SVG URLs are encoded (safe for CSS `background-image`).
