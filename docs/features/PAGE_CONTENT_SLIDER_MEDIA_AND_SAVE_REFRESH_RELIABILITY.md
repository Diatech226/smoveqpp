# Page Content Slider Media and Save/Refresh Reliability

## Canonical field contract

The canonical homepage contract is `pageContent.home` and slider media is stored only in:

- `home.heroBackgroundItems[]`
  - `media` (required)
  - optional responsive overrides: `desktopMedia`, `tabletMedia`, `mobileMedia`
  - optional `videoMedia`
  - presentation: `overlayColor`, `overlayOpacity`, `position`, `size`, `enableParallax`, `enable3DEffects`
- global slider settings:
  - `heroBackgroundRotationEnabled`, `heroBackgroundAutoplay`, `heroBackgroundIntervalMs`,
    `heroBackgroundTransitionStyle`, `heroBackgroundOverlayOpacity`,
    `heroBackgroundEnable3DEffects`, `heroBackgroundEnableParallax`

CMS writes this exact contract to `/content/page-content`, and the site reads this exact contract from `/content/public/page-content`.

## Persistence and reload behavior

To avoid stale UI state after save, CMS now uses:

1. Save payload to `/content/page-content`
2. Immediately reload authoritative page-content from backend
3. Reload media catalog from backend
4. Replace local repositories with authoritative data
5. Replace form state and saved snapshot from authoritative response

This ensures the editor sees backend truth after save, not optimistic local-only state.

## Public site media resolution behavior

Hero slider may include `media:<asset-id>` references. These resolve through the media repository.

To prevent unresolved references on public homepage:

1. homepage now fetches public media catalog (`/content/public/media`) together with page-content
2. public media repository is refreshed before/with page-content usage
3. hero resolver converts `media:` references to real URLs from that catalog

If media API is unavailable, the site logs a warning and safely falls back.

## Unsaved-change handling

When leaving CMS sections:

- If current section is **Page Content** and there are unsaved changes, editor is prompted to:
  - save before leaving, or
  - explicitly discard
- If save fails, navigation is blocked to prevent silent data loss.
- Existing global beforeunload warning remains active for unsaved changes.

## Page-content image UX improvements

In CMS Page Content > Hero slider:

- each slide now shows a render preview card (desktop-resolved source)
- preview displays source type and resolution status
- unresolved references show explicit warning so editors can fix before save

## Diagnostics

Added lightweight diagnostics:

- CMS logs save success with number of hero background items persisted
- CMS logs save failure when authoritative reload cannot be completed
- public site warns when hero uses media references but media catalog cannot be refreshed

