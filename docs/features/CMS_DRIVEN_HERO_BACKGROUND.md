# CMS-driven Hero Background

## Content model (homepage)

The homepage content contract now includes a dedicated hero background system:

- `heroBackgroundItems[]`
  - `id`: stable identifier for ordering and React keys.
  - `label`: internal CMS label.
  - `media`: media reference (`media:<id>`) or valid URL.
  - `alt`: optional accessibility text.
  - `overlayOpacity`: per-slide dimming value (`0` to `0.9`).
  - `focalPoint`: CSS object-position hint (e.g. `center`, `top`, `65% 30%`).
- `heroBackgroundRotationEnabled`: enables slider behavior.
- `heroBackgroundAutoplay`: enables automatic playback.
- `heroBackgroundIntervalMs`: autoplay interval (`2000` to `30000`).
- `heroBackgroundTransitionStyle`: `fade` or `slide`.
- `heroBackgroundOverlayOpacity`: global readability overlay (`0.1` to `0.9`).

## CMS fields and workflow

In CMS → Page Content → Hero:

1. Add one or multiple media slides from the media library.
2. Reorder slides with up/down controls.
3. Configure rotation/autoplay/interval/transition.
4. Tune readability overlays globally or per slide.
5. Save as usual through the existing page-content endpoint.

## Rendering strategy and 3D preservation

The hero keeps the previous immersive stack:

1. CMS media layer (single/rotating).
2. Dimming overlay for contrast.
3. Existing animated grid + glow gradients.
4. Existing 3D floating cards/parallax stage.
5. Existing hero text and CTA layer.

This ensures brand identity and depth effects are preserved while media becomes CMS-managed.

## Fallback behavior

- Invalid/missing media references are resolved to deterministic placeholder images.
- The hero never renders a blank background due to a bad media entry.
- If no hero media item exists, the original premium gradient background remains active.

## Validation and persistence

- CMS UI validates media references and slideshow interval.
- API enforces media validity, interval bounds, transition options, and overlay ranges.
- Media references in `heroBackgroundItems` are included in media usage indexing/safe-delete guardrails.

## Future extensions

- Add video type targeting and performance rules (per breakpoint).
- Add manual controls (dots/arrows) when rotation is enabled.
- Add per-slide transition overrides and advanced easing presets.
