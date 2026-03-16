# Iteration 01 — Content Contract Alignment (Projects + Blog)

## Objective
Eliminate highest-risk CMS create/edit mismatches that prevent complete public rendering.

## Scope
- Projects CMS form + backend payload alignment.
- Blog CMS form completeness for publication metadata.

## Affected domains
- Projects, Blog, Media references.

## Key bugs to fix
1. Project CMS cannot author full gallery while detail page renders `images[]`.
2. Project CMS cannot author testimonial used by detail page.
3. Project CMS lacks `links.caseStudy` input.
4. Blog `socialImage` not explicitly editable though part of SEO model.
5. Blog publication date not editable.

## Data model fixes
- Extend `ProjectFormState` with:
  - `galleryImages` (multiline or tokenized list)
  - `testimonialText`, `testimonialAuthor`, `testimonialPosition`
  - `caseStudyLink`
- Extend project save mapping to persist these fields.
- Extend `BlogFormState` UI to expose:
  - `socialImage`
  - `publishedDate` (with sensible validation/default)

## Expected deliverables
- Updated CMS project/blog forms.
- Validation and mapping updates in CMS save handlers.
- Adapter/repository tests covering new fields.

## Risk level
**Medium** — mostly additive form/model alignment.

## Validation criteria
- Create a project with 3 gallery images + testimonial + case study URL; verify rendering in project detail.
- Create a blog post with explicit `socialImage` and scheduled/manual publish date; verify persistence + public contract output.
- Ensure slug/status and publish transitions still pass existing guards.
