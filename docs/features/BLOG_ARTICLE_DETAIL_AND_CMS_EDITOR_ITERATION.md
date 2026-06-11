# Blog article detail and CMS editor iteration

## Scope

This iteration changes only the single-article experience, article routing/API behavior, and the CMS article editor. Existing public blog listing cards remain unchanged.

## Public article detail UX

- The article route is `#/blog/:slug`; cards continue to supply the canonical article slug.
- The detail service first calls `GET /api/v1/content/public/blog/:slug`, then falls back to a lookup in the public article list for legacy slug/canonical-slug/id compatibility.
- The page provides a premium responsive hero, controlled `object-fit: cover` Cloudinary hero variant, title, category, available author/date/reading-time metadata, excerpt, an approximately 820px reading column, wrapping share controls, related articles, contact CTA, and back-to-blog navigation.
- Empty or unresolved image relationships render the site fallback visual. Body images, when supported by rendered rich content, must remain `max-width: 100%; height: auto`.
- Missing articles render a dedicated 404 state with a route back to the blog.

## CMS article creation and editing flow

The editor is organized into:

1. **Informations de base** — required title plus optional slug, author, reading time, category, and tags.
2. **Image principale** — required for initial creation; choose from the media library, upload locally to Cloudinary-backed media storage, preview, replace, or clear.
3. **Contenu** — optional summary and body.
4. **SEO / aperçu social** — optional SEO fields and independently managed social image.
5. **Publication** — publish date, status, save-draft/review/publish workflow.

After save, the CMS refreshes from the API before reporting success. The article list shows the resolved image preview and a **Voir sur le site** action whenever a slug exists.

## Image relationship and update/delete behavior

The main-image resolution priority is:

1. `mediaRoles.featuredImage`
2. `featuredImage`
3. `coverImage`
4. `image`
5. `imageUrl`
6. `socialImage`

Canonical CMS relationships are stored as `media:<id>` in `featuredImage`, `mediaRoles.featuredImage`, and—when selected—social-image fields. Local uploads are first added to the media library, then linked by canonical media reference. Blob URLs and filename-only references are not stored.

**Clear** removes the image relationship from the article and clears legacy main-image aliases. It does **not** delete or archive the media-library record. Deleting the physical/Cloudinary-backed asset remains a separate media-library operation. A published article with a cleared main image remains renderable and uses the public fallback visual.

PATCH preserves existing properties unless a field is explicitly sent as empty. An explicit empty main-image field clears canonical and legacy main-image aliases so stale references cannot silently reappear.

## API contract

Supported article operations:

- `POST /api/v1/content/blog`
- `PATCH /api/v1/content/blog/:id`
- `DELETE /api/v1/content/blog/:id`
- `GET /api/v1/content/blog`
- `GET /api/v1/content/public/blog`
- `GET /api/v1/content/public/blog/:slug`

Slugs are normalized/generated from titles. New CMS articles require a title and main image; optional editorial fields may be empty. Existing image relationships may be explicitly cleared. CMS deletion requires confirmation.

## Validation checklist

### CMS

- [ ] Create an article with title + image.
- [ ] Choose the image from Media Library and verify a `media:<id>` relationship.
- [ ] Upload an image from local disk and verify it appears in Media Library and the article preview.
- [ ] Replace the article image and save.
- [ ] Clear the article image, save, refresh, and verify the media-library record remains.
- [ ] Update title, content, SEO, social image, status, and publish date.
- [ ] Confirm **Voir sur le site** opens the correct slug.
- [ ] Delete an article after accepting confirmation.

### Public site

- [ ] Existing blog-list cards are visually unchanged.
- [ ] Clicking a card opens the corresponding detail route.
- [ ] Hero uses a Cloudinary optimized variant and never stretches.
- [ ] Missing images show the fallback visual.
- [ ] Metadata, excerpt, article body, share controls, and related articles respond correctly on mobile, tablet, and desktop.
- [ ] Unknown slugs show the clean article 404 page.
