# Blog Professional Iteration

## CMS editor flow

The CMS blog editor is organized into five editorial tabs:

1. **Basic info** — title (the only required field), optional slug, author, reading time, category, tags, and a preview card.
2. **Media** — featured image and social image selection from the Media Library, Cloudinary upload, preview, replace, and clear actions.
3. **Content** — optional summary, lightweight rich-text toolbar content, and secondary content blocks.
4. **SEO** — optional SEO title, SEO description, and canonical slug.
5. **Publishing** — status, publication date, contract readiness message, and View on site link.

The save flow does not show fake success: after create/update, the CMS refetches the authoritative blog list and verifies the saved article appears before showing success.

## Article schema

Only `title` is required. Optional fields are normalized safely:

- `slug` auto-generates from title when omitted.
- `status` follows the backend default convention (`published` unless supplied).
- `excerpt` / `summary`, `content` / `body`, `author`, `category`, `tags`, `readTime`, SEO fields, images, and `contentBlocks` may be empty.
- `contentBlocks[]` supports `paragraph`, `heading`, and `image` blocks with optional `title`, `caption`, `text`, `media`, and `layout`.

## Media handling

Blog media is stored by reference as `media:<id>` when chosen from the Media Library or uploaded to Cloudinary through the CMS.

Supported fields include:

- `featuredImage`
- `coverImage`
- `image`
- `imageUrl`
- `socialImage`
- `mediaRoles.featuredImage`
- `mediaRoles.socialImage`
- `contentBlocks[].media`

The public renderer resolves media references to optimized Cloudinary variants and uses fallback visuals when no image is available.

## Public rendering

The public blog detail page renders a premium article layout with:

- hero image with object-cover aspect ratio (no stretching)
- category badge, title, date, author, reading time, and summary
- readable max-width article typography
- share actions
- secondary images with captions
- CTA section
- related article cards with dedicated grid gaps
- back-to-blog and clean 404 states

The listing page uses optimized card/hero image variants and a branded fallback when an article has no image.

## Validation checklist

### CMS

- Create an article with only `title`.
- Add a featured image from the Media Library.
- Upload an image from local disk to Cloudinary.
- Write formatted content with headings, bold, italic, lists, quotes, and links.
- Add a secondary image block with title/caption.
- Reorder and delete secondary image blocks.
- Update an article and confirm the CMS refetches it.
- Delete an article.
- Open **View on site**.

### Site

- Blog listing loads published articles only.
- Blog cards have valid detail links.
- Article detail works on refresh/hash route.
- Missing article shows the clean 404 state.
- Images use optimized variants and do not stretch.
- Related cards are spaced correctly.
- Mobile layout remains readable.
