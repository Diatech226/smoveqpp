# CMS Interactive Background + Public Hero Render Reliability Fix

## Scope
This fix hardens the full CMS → API → public-site flow for the homepage interactive/changing hero background.

## Add-image behavior (CMS)
- The **Ajouter une image** action in the hero background editor is a pure editor action.
- Clicking it **must not navigate** to the public website.
- The click handler now aggressively blocks navigation bubbling (`preventDefault`, `stopPropagation`, `stopImmediatePropagation` when present) before appending a new slide item.

## CMS background-item workflow
- Adding a slide creates a new editable hero background item in CMS form state.
- Editors can set media via:
  - Media Library selection (`media:*` references)
  - Direct upload (upload goes through CMS media API then links the uploaded media reference)
- Media-field coherence is now enforced when assigning responsive fields:
  - Setting `media` auto-fills `desktopMedia` when empty.
  - Setting `desktopMedia` first auto-fills `media` when empty.
  - Setting `tabletMedia` first auto-fills `desktopMedia` + `media` when empty.
- This prevents invalid “responsive-only” configurations that previously looked configured in CMS but failed save validation.

## Save / reload behavior
- Hero background entries are validated before save.
- Saves remain backend-authoritative (CMS reloads canonical content from backend after write).
- Reload/reset uses the authoritative saved snapshot.

## Public-site render behavior
- Public hero resolves background items through media resolution helpers.
- Media-library references and URL media both render correctly.
- Unresolved media references degrade safely (non-crashing fallback) instead of breaking hero rendering.
- Rotation/autoplay/transition logic remains unchanged and continues to work with multiple slides.

## CMS edit vs public preview separation
- Hero background actions (`Ajouter une image`, media selectors, upload) are strictly editing actions.
- Public-site navigation remains a separate, explicit dashboard action (`Voir le site`) outside the hero media editor flow.
