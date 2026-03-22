# Projects Iteration P1 — Contract Convergence

Date: 2026-03-22

## Scope
Converge the Projects contract across CMS forms, repository normalization, backend normalization, homepage/list/detail selection, and public rendering without visual redesign.

## Authoritative media-role contract

### Canonical precedence
- Card image: `mediaRoles.cardImage` → `mediaRoles.heroImage` → `mediaRoles.coverImage` → `featuredImage` → `mainImage` → fallback query.
- Hero image: `mediaRoles.heroImage` → `mediaRoles.coverImage` → `mediaRoles.cardImage` → `mainImage` → `featuredImage` → card image.
- Gallery images: `mediaRoles.galleryImages[]` → legacy `images[]` → `[hero image]`.
- Social image: `mediaRoles.socialImage` → `seo.socialImage` → role card/hero fallback chain → card image.

### Compatibility retained
- Legacy `featuredImage`, `mainImage`, and `images` are still accepted and normalized.
- Repository and backend normalization keep legacy-compatible outputs while emitting deterministic role fields.
- CMS edit/save flow now rehydrates and persists gallery via `mediaRoles.galleryImages` first (legacy `images` as fallback) to keep edit/render parity.

## Published-only public selection rules

- Homepage project selector now includes only `status === 'published'`.
- Homepage selector prioritizes `featured` within published projects, then fills with other published projects.
- Projects listing remote fallback also enforces `status === 'published'`.
- Public selectors share a dedicated published-only selector helper so fallback paths cannot leak `in_review`.
- Project detail route resolution now only resolves from `projectRepository.getPublished()`.

## CTA/link contract decision

- Kept editable CMS fields:
  - `externalLink` (maps to `link` and `links.live`)
  - `caseStudyLink` (maps to `links.caseStudy`)
- Public detail rendering now shows optional CTAs when these links are present.
- Legacy payload compatibility added for `externalLink` and `caseStudyLink` normalization in both frontend repository and backend content service.

## Featured-homepage behavior

Deterministic featured semantics:
1. Select published projects.
2. Preserve order while taking published featured projects first.
3. Fill remaining slots from published non-featured projects.
4. Apply homepage limit.

## Surface mapping (CMS ↔ public)

- Card surface: `cardImage`, `summary`, taxonomy/meta chips.
- Detail hero surface: `heroImage`, title/description/client/year/tags.
- Detail gallery surface: `galleryImages`.
- CTA surface: `externalLink`, `caseStudyLink`.
- Social/share storage surface: `mediaRoles.socialImage`/`seo.socialImage`.
- Narrative surface: challenge/solution/results/testimonial.

## Remaining P2 opportunities

- Add stricter publish-readiness checks for social metadata and cross-surface completeness.
- Expand social metadata consumption (meta tags/canonical social references) on project detail routes.
- Add optional CMS helper text for social-image role once UI/SEO iteration starts.
