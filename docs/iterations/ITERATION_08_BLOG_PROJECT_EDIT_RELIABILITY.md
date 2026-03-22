# Iteration 08 — Blog/Projects Edit Reliability & Image Contract Hardening

## Scope
- Fix unreliable edit/update flows for existing Blog and Project entries.
- Remove image-field ambiguity between legacy and canonical fields in CMS edit forms.
- Preserve backward compatibility with legacy records while writing coherent canonical payloads.

## What was fixed

### Blog
- CMS edit hydration now resolves featured/social image fields using deterministic precedence:
  1. `mediaRoles.featuredImage`
  2. `mediaRoles.coverImage`
  3. `mediaRoles.cardImage`
  4. `featuredImage`
  5. `images[0]`
- Social image hydration now uses:
  1. `mediaRoles.socialImage`
  2. `seo.socialImage`
  3. resolved featured image
- Blog save mapping now preserves existing non-edited image structures (including extra `images[]` entries and legacy role keys) instead of dropping them on update.

### Projects
- CMS edit hydration now resolves role-aware card/hero/social media consistently from `mediaRoles` + legacy fields.
- Gallery hydration now safely supports old shapes where `mediaRoles.galleryImages` or `images` may be missing.
- Project save mapping now writes explicit `mediaRoles.socialImage` + `seo.socialImage` from a dedicated CMS social image field (with fallback to card/hero).

## Canonical image contract decisions

### Blog canonical write shape
- `featuredImage`: primary editorial featured image.
- `mediaRoles.featuredImage`: mirrors canonical featured image.
- `seo.socialImage` + `mediaRoles.socialImage`: explicit social sharing image with featured fallback.
- Legacy role keys are preserved on update where present.

### Projects canonical write shape
- `mediaRoles.cardImage`: portfolio card image.
- `mediaRoles.heroImage` / `mediaRoles.coverImage`: detail hero image.
- `mediaRoles.galleryImages`: detail gallery images.
- `mediaRoles.socialImage` + `seo.socialImage`: social sharing image.
- Legacy fields (`featuredImage`, `mainImage`, `images`) remain compatible and aligned with canonical roles.

## Compatibility
- Existing records created with legacy-only image fields remain editable.
- Existing records with mixed legacy/canonical shapes now hydrate into a coherent edit form state.
- Read-after-write behavior is stable for both URL and `media:<id>` references.
