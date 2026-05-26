# Project Creation and Fetch Flow

## Required fields
- `title`
- one project media reference (`mediaRoles.cardImage`, `cardImage`, `featuredImage`, `image`, `imageUrl`, `media`, `heroImage`)

## Optional fields
- slug (auto-generated from title when empty)
- summary, description, category, client, location, dates, tags, gallery, SEO, featured, links, testimonial
- status defaults to existing project status convention (`published` fallback)

## Media handling
- Media can be picked from media library or uploaded from CMS project form.
- Upload writes asset in media library and project stores `media:<id>` references.
- Canonical project media written by CMS:
  - `mediaRoles.cardImage`
  - `mediaRoles.heroImage`
  - `cardImage`
  - `heroImage`

## API endpoints
- Protected CMS CRUD:
  - `GET /api/v1/content/projects`
  - `POST /api/v1/content/projects`
  - `PATCH /api/v1/content/projects/:id`
  - `DELETE /api/v1/content/projects/:id`
- Public:
  - `GET /api/v1/content/public/projects`
  - `GET /api/v1/content/public/media`

## Site fetch flow
- Site fetches `GET /api/v1/content/public/projects`.
- Response normalization supports:
  - `{ projects: [...] }`
  - `{ items: [...] }`
  - `{ data: [...] }`
  - root array
- Card media priority:
  1. `mediaRoles.cardImage`
  2. `cardImage`
  3. `featuredImage`
  4. `image`
  5. `imageUrl`
  6. `media`
  7. `heroImage`
  8. `mediaRoles.heroImage`
- Detail media priority:
  1. `mediaRoles.heroImage`
  2. `heroImage`
  3. `mediaRoles.cardImage`
  4. `cardImage`
  5. `featuredImage`
  6. `image`
  7. `imageUrl`
  8. `media`

## Validation checklist
- CMS blocks save only when title or media is missing.
- CMS error messages:
  - `Veuillez saisir un titre de projet.`
  - `Veuillez ajouter une image ou un média pour ce projet.`
- API accepts legacy/partial projects and does not reject optional-field gaps.
- Project create appends; update mutates by id only; delete stays explicit.
- Failed remote fetch does not clear local in-memory project state.
