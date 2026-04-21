# Hero Slider Controls and CMS UI Upgrade

## Public site behavior (hero slider)

- Hero backgrounds keep **all valid slides mounted** and animate visibility with fade/slide transitions.
- Active slide is tracked with a safe index (`active % slides.length`) so reordering/removal does not break rendering.
- Autoplay advances with `heroBackgroundIntervalMs` (clamped to `2000..30000ms`, default 6000ms) when:
  - rotation is enabled,
  - autoplay is enabled,
  - at least 2 slides are available,
  - and the user is not currently interacting with slider controls.
- Mouse hover and focus on controls pause autoplay to avoid accidental jumps while navigating manually.
- Video-only slides are now accepted and render correctly when `type=video` and `videoMedia` is set.

## Navigation controls

- Previous/next buttons are visible when 2+ slides exist.
- Buttons wrap index navigation correctly (`0 -> last`, `last -> 0`).
- Controls now include a compact progress pill (`current/total`) for editor/user orientation.
- Dot indicators map one-to-one with slides.
- Active dot uses stronger visual treatment with `aria-pressed=true` and `aria-current=true`.

## Transition/readability quality

- Each slide keeps its own overlay color/opacity and adaptive media source (desktop/tablet/mobile).
- Active slide metadata card (title/description/CTA) stays tied to the active item only.
- Layering prevents hidden-slide pointer collisions and reduces flicker during transitions.

## CMS hero slide management UX

- Hero media editor now exposes summary cards (slides configured, resolved media, transition/interval, rotation state).
- Slide headers include readable identity (`Slide N • Label`).
- Slide cards are now grouped into professional editor blocks:
  - **Contenu de slide**
  - **Médias & responsive**
  - **Overlay, position et effets**
- Slide cards now include quick responsive-media visibility chips (desktop/tablet/mobile/video references).
- Reorder action labels are explicit (`Monter`, `Descendre`) for clarity.
- Added/kept **Duplicate** action per slide to speed production workflows.
- Adding a second slide from CMS helpers auto-enables rotation for safer first-time slideshow behavior.

## Synchronization expectations

- CMS saves still persist `heroBackgroundItems` (order + fields) as before.
- API normalization now preserves valid video-only slides instead of dropping them.
- Re-open/reload continues to restore slide order via `sortOrder` normalization.
- Public site consumes the same stored payload and renders according to active media references.
