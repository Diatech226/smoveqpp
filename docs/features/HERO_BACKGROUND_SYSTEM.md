# HERO Background System

## Overview

The homepage hero background is now a CMS-driven media system with:

- Media Library references as primary source (`media:<id>`)
- Responsive image targeting (desktop / tablet / mobile)
- Optional video source per slide
- Overlay color + opacity controls
- Position and fit controls (`background-position`, `background-size`)
- Global and per-slide motion toggles for 3D/parallax compatibility

## CMS content model

`home.heroBackgroundItems[]` fields:

- `id`, `label`
- `type`: `image | video`
- `media` (required primary media reference)
- `desktopMedia`, `tabletMedia`, `mobileMedia` (optional overrides)
- `videoMedia` (optional)
- `alt`
- `overlayColor`, `overlayOpacity`
- `position`, `size`
- `enableParallax`, `enable3DEffects`

Global hero controls:

- `heroBackgroundRotationEnabled`
- `heroBackgroundAutoplay`
- `heroBackgroundIntervalMs`
- `heroBackgroundTransitionStyle`
- `heroBackgroundOverlayOpacity`
- `heroBackgroundEnable3DEffects`
- `heroBackgroundEnableParallax`

## Media integration behavior

- CMS UI selects backgrounds from Media Library references.
- API normalization preserves legacy URL compatibility for older content.
- API registers all responsive/video hero references in media usage graph.
- Validation enforces required primary background media while allowing optional responsive/video fields.

## Responsive selection logic (frontend)

- `< 768px`: uses `mobileMedia` then fallback chain
- `768px - 1023px`: uses `tabletMedia` then fallback chain
- `>= 1024px`: uses `desktopMedia` then fallback chain
- Fallback chain always terminates at `media`.

Media variants are preferred where available:

- desktop -> `hero`
- tablet -> `card`
- mobile -> `thumbnail`

## Rendering strategy

- Hero background renders via CSS `background-image` for image mode.
- `background-size` and `background-position` map to CMS controls.
- Overlay renders as gradient based on `overlayColor` + opacity.
- Video mode can render a muted looping background video layer.
- Existing 3D UI remains intact and can be toggled globally/per-slide.

## Fallback behavior

- Missing media references resolve to deterministic placeholder media.
- Legacy direct URLs remain supported during migration.
- If no slides are configured, the premium built-in hero visual remains active.

## Performance notes

- Responsive media reduces over-delivery to mobile devices.
- Media variant resolution prefers optimized derivatives when present.
- Video preload set to metadata.
- Rotation interval clamped to avoid rapid re-renders.

## Testing coverage

- Hero background resolver tests updated for enhanced schema.
- Public page content API test updated for responsive background payload.
- Existing slideshow autoplay/index tests remain validated.
