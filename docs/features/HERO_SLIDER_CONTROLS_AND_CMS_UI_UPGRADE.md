# Hero Slider Controls and CMS UI Upgrade

## Public site behavior

- Hero backgrounds now keep **all valid slides mounted** and animate visibility with fade/slide transitions.
- Active slide is tracked with a safe index (`active % slides.length`) so reordering/removal does not break rendering.
- Autoplay advances with `heroBackgroundIntervalMs` (clamped minimum 2000ms) when:
  - rotation is enabled,
  - autoplay is enabled,
  - at least 2 slides are available,
  - and the user is not currently interacting with slider controls.
- Mouse hover and focus on controls pause autoplay to avoid accidental jumps while navigating manually.

## Navigation controls

- Previous/next buttons are visible when 2+ slides exist.
- Buttons wrap index navigation correctly (`0 -> last`, `last -> 0`).
- Dot indicators map one-to-one with slides.
- Active dot uses stronger visual treatment and `aria-pressed=true`.

## Transition/readability quality

- Each slide keeps its own overlay color/opactity and adaptive media source (desktop/tablet/mobile).
- Active slide metadata card (title/description/CTA) stays tied to the active item only.
- Layering prevents hidden-slide pointer collisions and reduces flicker during transitions.

## CMS hero slide management UX

- Hero media editor now exposes quick summary chips (slide count, transition mode, interval, rotation state).
- Slide headers include readable identity (`Slide N • Label`).
- Slide cards now include quick responsive-media visibility chips (desktop/tablet/mobile/video references).
- Added **Duplicate** action per slide to speed production workflows.
- Adding a second slide from CMS helpers auto-enables rotation for safer first-time slideshow behavior.

## Synchronization expectations

- CMS saves still persist `heroBackgroundItems` (order + fields) as before.
- Re-open/reload continues to restore slide order via `sortOrder` normalization.
- Public site consumes the same stored payload and renders according to active media references.
