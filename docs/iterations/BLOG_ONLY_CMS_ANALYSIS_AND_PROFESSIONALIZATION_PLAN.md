# Blog-only CMS Analysis and Professionalization Plan

## Iteration 1 — Blog Contract Convergence (List / Detail / Publishability)

### Status (2026-03-22)
Implemented.

### Contract decisions applied
- Public list and detail now converge on authoritative backend public data when available.
- Detail lookup precedence is deterministic:
  1. `seo.canonicalSlug`
  2. normalized `slug`
  3. normalized `id` (legacy compatibility fallback)
- Published blog readiness parity is enforced across save and transition for:
  - title
  - slug validity
  - featured image validity
  - published date validity
- Featured image contract for public rendering is unified:
  1. `mediaRoles.featuredImage`
  2. `mediaRoles.coverImage`
  3. `mediaRoles.cardImage`
  4. legacy `featuredImage`

### Iteration 2 preview
- media role governance tightening (editorial policy + migration tooling)
- taxonomy governance hardening with editorial UX aids
- SEO workflow completion and stronger diagnostics
