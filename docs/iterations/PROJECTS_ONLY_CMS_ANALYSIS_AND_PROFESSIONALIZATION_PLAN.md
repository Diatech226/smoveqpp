# Projects-only CMS Analysis and Professionalization Plan

## Iteration P1 — Projects Contract Convergence (Data + Rendering Parity)

Status: ✅ Completed on 2026-03-22.

See the implementation report: `docs/iterations/PROJECTS_ITERATION_P1_CONTRACT_CONVERGENCE.md`.

### P1 outcomes
- Media roles are authoritative for card/hero/gallery/social resolution (including `coverImage` fallback) with legacy field compatibility retained.
- Public project selection now uses `published` only across homepage, project listing, and project detail lookups.
- CTA link contract now has clear authored fields (`externalLink`, `caseStudyLink`) and rendered outcomes on the public project detail page.
- Homepage featured semantics are deterministic (`published + featured` first, then other `published` projects).
- Internal mapping clarity between CMS fields and public surfaces is documented, including published-only selector helper reuse and gallery role-first CMS mapping.

### Next focus (Iteration P2)
- Introduce stricter project publishability quality checks (social/SEO completeness and richer surface-specific validation).
- Expand project social metadata rendering once canonical metadata surfaces are finalized.
