# CMS Background Media Image Workflow Fix

## Scope
This fix targets the **Contenu de page → Background media (CMS)** editor workflow for hero background slides.

## What was fixed

### 1) Add-image action reliability
- The CTA is now explicit as **"Ajouter une image"** and remains a pure CMS button action.
- Clicking it always appends a new editable hero background item in form state.

### 2) Media Library selection flow
- Existing Media Library assets can still be selected via the per-field dropdowns (`media`, `desktopMedia`, `tabletMedia`, `mobileMedia`, `videoMedia`).
- Selected entries are stored as canonical `media:<asset-id>` references.

### 3) Direct device upload flow (inside background editor)
- A dedicated **Upload image principale** control is available on each slide row.
- The upload pipeline calls the backend media upload endpoint, creating a proper Media Library record.
- Once upload succeeds, the returned media asset is automatically linked to the target slide field.
- The CMS media catalog is refreshed immediately after upload so the newly created asset is available in selectors.

### 4) State coherence and persistence
- Upload assignment updates `homeContentForm.heroBackgroundItems` immediately, so editors see the linked value before saving.
- If an upload is initiated for a slide that no longer exists, CMS safely creates a new hero item and links the uploaded media.
- Existing page-content save flow remains authoritative and persists `heroBackgroundItems` via backend API.

### 5) Public rendering consistency
- Public rendering already resolves hero slide media references through canonical media resolution.
- By ensuring hero slide assignments are always saved as valid `media:` references created through Media Library upload, public hero background resolution remains coherent after save/reload.

## UX additions
- Visible upload-in-progress state for the target slide.
- Inline warning message when a hero slide upload fails.

## Fallback and error handling
- Upload errors show a user-facing warning and do not silently mutate form state.
- File input is reset after each upload attempt to permit immediate retry.
