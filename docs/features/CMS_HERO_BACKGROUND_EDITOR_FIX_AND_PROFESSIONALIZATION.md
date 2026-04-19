# CMS Hero Background Editor — Fix & Professionalization

## Scope
This document describes the reliability hardening applied to **Contenu de page → Hero → Médias d'arrière-plan (CMS)** and the aligned public rendering behavior.

## Hero background item model
The CMS and site both use the `heroBackgroundItems[]` contract with these key fields:

- `id`, `label`, `type` (`image`/`video`)
- `media` (required canonical primary media reference)
- responsive overrides: `desktopMedia`, `tabletMedia`, `mobileMedia`
- optional `videoMedia`
- visual controls: `overlayColor`, `overlayOpacity`, `position`, `size`, `enableParallax`, `enable3DEffects`

Notes:

- At save time, each item is normalized and invalid items (empty base media) are rejected server-side and client-side.
- Media references should be `media:<assetId>` whenever possible. Direct URLs remain tolerated for legacy fallback.

## Add / select / upload workflow
### Add slide
- Use **Ajouter une slide** to append a new hero background item in CMS state.
- The action is explicitly a CMS button (`type="button"`) and does not navigate away.

### Select from Media Library
- Use the select controls on each slide (`media`, `desktopMedia`, `tabletMedia`, `mobileMedia`, `videoMedia`).
- If a saved reference no longer exists in the active media catalog, the editor now keeps that reference visible as:
  - `Référence actuelle (introuvable): media:...`
- This avoids silent value disappearance and makes corrective action explicit.

### Upload
- `Upload image principale` uploads through the media API and then auto-links the uploaded media to the current hero slide.
- Upload status and errors are displayed inline for predictable editor feedback.

## Save / persistence / reload behavior
- Save validates:
  - required hero title fields
  - media field validity
  - slideshow interval bounds
  - CTA href format
- On successful save, CMS re-fetches authoritative backend content and backend media catalog before updating local form state.
- This enforces **save → reload parity** and prevents fake-success drift.

## Public site rendering behavior
- Site hero resolves each configured slide into render-safe sources (desktop/tablet/mobile/video).
- `media:` references are resolved through the public media repository.
- Missing/archived references degrade to a deterministic safe fallback (never raw unresolved `media:` in final rendered source).
- Overlay opacity handling is hardened to avoid malformed numeric values propagating to runtime styles.

## Preview/navigation separation safeguards
- CMS editing actions remain in CMS context.
- A dedicated **Prévisualiser le site** action is explicitly separated from edit actions.
- Edit buttons (add/select/upload/remove/reorder) are independent of site navigation.

## Additional UX safeguards
- Unresolved slide count warning appears at the hero media section level.
- Per-slide public-preview card highlights resolution state (`résolu`/warning) to reduce publish-time surprises.
- Workflow hint in section header clarifies recommended editor sequence.
