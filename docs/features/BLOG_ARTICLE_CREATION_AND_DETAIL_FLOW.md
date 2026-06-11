# Blog article creation and detail flow

## Required fields

A blog article requires only:

1. `title` (article name)
2. one image/media value

The API accepts the image from `mediaRoles.featuredImage`, `featuredImage`, `coverImage`, `image`, `imageUrl`, or `socialImage`. The canonical saved values are `mediaRoles.featuredImage = "media:<id>"` and `featuredImage = "media:<id>"` whenever the media can be registered.

All other fields are optional. Missing slugs are generated from the title, missing status defaults to `published`, and missing summary/excerpt/content/body values remain empty without preventing creation or rendering.

CMS validation messages:

- Missing title: `Veuillez saisir le nom de l’article.`
- Missing image: `Veuillez ajouter une image pour l’article.`

## Media picker and upload flow

The CMS article form supports both image paths:

- choose an existing image from the media library;
- upload an image from disk.

Local uploads are sent through the protected media upload API, stored by the configured media storage provider (Cloudinary in production), followed by a media-library refetch. The selected/uploaded image is assigned as a stable `media:<id>` reference and previewed immediately.

The public site hydrates media from `GET /api/v1/content/public/media` before resolving an article image. Resolution supports `media:<id>`, direct Cloudinary/HTTP URLs, and legacy `/uploads` URLs.

## API endpoints

Protected CMS endpoints:

- `GET /api/v1/content/blog`
- `POST /api/v1/content/blog`
- `PATCH /api/v1/content/blog/:id`
- `DELETE /api/v1/content/blog/:id`

Public endpoints:

- `GET /api/v1/content/public/blog`
- `GET /api/v1/content/public/blog/:slug`
- `GET /api/v1/content/public/media`

The public list exposes published articles. Public detail lookup normalizes the requested value and checks the article slug, `seo.canonicalSlug`, then the article id for legacy compatibility.

## Slug and detail route flow

The API and clients normalize slugs consistently by lowercasing, removing diacritics/special characters, and joining words with hyphens. Public cards always build `#/blog/<slug>` links using canonical slug, primary slug, or id fallback. The hash router resolves that link to the blog detail page, which requests `GET /api/v1/content/public/blog/:slug`.

If the detail endpoint is unavailable, the site fetches the public blog list and finds the article by canonical slug, primary slug, or id. A 404 is shown only after both retrieval paths fail.

## Persistence and refresh guarantees

- Create appends/upserts one article; it does not replace the collection with local state.
- Update changes only the selected article id.
- Delete remains explicit.
- Failed list fetches do not clear the current CMS list.
- After save, the CMS refetches the authoritative blog list and reports success only after the saved article appears.

## Validation checklist

### CMS

- [ ] Create with title + uploaded image.
- [ ] Create with title + media-library image.
- [ ] Confirm the article and image preview appear immediately after authoritative refetch.
- [ ] Confirm body, category, author, tags, SEO, social image, date, reading time, and manual slug are optional.

### API

- [ ] `POST /api/v1/content/blog` succeeds with title + image.
- [ ] `GET /api/v1/content/blog` includes the created article.
- [ ] `GET /api/v1/content/public/blog` includes the published article.
- [ ] `GET /api/v1/content/public/blog/:slug` returns it by slug, canonical slug, and id fallback.

### Public site

- [ ] Blog card renders with its resolved image.
- [ ] Clicking the card opens `#/blog/:slug`.
- [ ] Detail page renders title, image, and any available summary/content.
- [ ] Refreshing the detail URL still resolves the same article.
