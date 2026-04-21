# Hero Slide Logic Implementation

## Behavioral contract source

The CMS and public Hero behavior is aligned with the `pageContentHeroActions` test contract in:

- `apps/cms/src/components/cms/dashboard/pageContentHeroActions.test.tsx`

This contract defines add-slide semantics, non-navigation click handling, media field coherence, and unresolved reference visibility in CMS controls.

## Hero slide data model

A hero slide (`home.heroBackgroundItems[]`) is stored with:

- identity/order: `id`, `sortOrder`, `label`
- optional content: `title`, `description`, `ctaLabel`, `ctaHref`
- media fields: `media`, `desktopMedia`, `tabletMedia`, `mobileMedia`, `videoMedia`
- visual options: `overlayColor`, `overlayOpacity`, `position`, `size`, `enableParallax`, `enable3DEffects`

The canonical rule is that a slide must always have a usable primary media reference (`media` or a responsive override), and media references are persisted as direct URL or `media:<asset-id>`.

## CMS workflow (add/edit/upload)

1. **Add slide** (`Ajouter une diapositive`) appends a concrete editable item in form state.
2. **Click safety** uses explicit event cancellation (`preventDefault`, propagation stop) so CMS actions never act like public navigation.
3. **Assign media** updates the selected field and keeps `media`/`desktopMedia` coherent for first assignment.
4. **Upload media** writes to media library, then immediately links to the intended slide; if the target slide no longer exists, a new slide is appended and linked.
5. **Unresolved references** remain visible in `<select>` controls as “Référence actuelle (introuvable): …” so editors can recover from stale saved IDs.

## Backend save/read behavior

- Home page content save payload includes `heroBackgroundItems`.
- API normalization preserves hero slide arrays and media fields with guardrails on opacity/type/position defaults.
- Reload path rehydrates the same fields into CMS editor state.

## Public Hero rendering behavior

- Public page content fetch hydrates `home.heroBackgroundItems` from backend.
- Media references resolve through canonical media resolver.
- Multiple slides remain renderable and ordered by `sortOrder`.
- Video slides are retained even when they only provide `videoMedia` (no image override), avoiding accidental drop from render pipeline.

## Unresolved media reference behavior

- CMS intentionally keeps unresolved saved references visible to prevent silent data loss.
- Public rendering degrades safely (placeholder/fallback media state) instead of crashing.

## Test-to-implementation relationship

- `pageContentHeroActions.ts` is the direct implementation target for add-slide, add-media click handling, and media assignment coherence.
- `CMSMainSections.tsx` renders the CMS-only controls expected by tests.
- `pageContentRepository` tests cover save/reload behavior for hero slides.
- `heroBackground` tests cover public-side resolution, including media-library references and video-only slides.
