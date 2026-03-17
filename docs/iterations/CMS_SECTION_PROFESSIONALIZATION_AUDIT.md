# CMS Section Professionalization Audit

This file tracks implementation progress against CMS professionalization iterations.

## Iteration status snapshot

- Iteration 1: completed.
- Iteration 2: completed baseline governance and public detail contracts.
- Iteration 3: completed media lifecycle safety, settings split authority, and runtime diagnostics baseline.
- Iteration 4: completed taxonomy governance baseline, service detail CMS authority expansion, brand assets authority, and settings rollback audit baseline.

## Iteration 2 outcomes

- Project workflow governance introduced with explicit lifecycle transitions (`draft → in_review → published → archived`) and role-aware publish control.
- Blog detail route contract completed via canonical slug routing (`#blog/<slug>`) and published-only detail resolution.
- Services detail baseline started: design/web detail pages now read overview/features/CTA from CMS-managed service content with safe fallback to previous static copy.
- Route integrity improved for blog slug normalization and service slug-based routes (`#service/<slug>`).
- Public rendering fallback hardened for optional metadata in project/blog/service detail rendering.

## Iteration 3 outcomes

- Media lifecycle safety professionalized with server-enforced reference checks across blog/projects/home/services/settings brand-media fields.
- Media delete flow moved to safe archive semantics (soft-delete baseline) to avoid irreversible removals while preserving `media:<id>` compatibility.
- Added media observability endpoints for explicit reference inspection and safe replace-in-place API path.
- Settings authority split introduced (`siteSettings` vs `operationalSettings`) with backward-compatible top-level fields to avoid migration breakage.
- Public runtime now consumes authoritative CMS site settings through `/content/public/settings` (site title + support email) with static fallback on backend outages.
- Added CMS synchronization diagnostics endpoint and dashboard warning signals for invalid media references / diagnostics unavailability.
- Divergence visibility improved by surfacing backend diagnostics status rather than silently relying on local fallback state.

## Iteration 4 outcomes

- Blog taxonomy governance baseline added with managed categories/tags in settings and server-side normalization to reduce category/tag drift.
- CMS blog editorial UX aligned with managed taxonomy expectations (guidance + deterministic category/tag handling).
- Service detail CMS authority expanded with process and CTA/editable detail fields, consumed on public service pages via safe fallback rendering.
- Settings authority extended to explicit brand assets (`logo`, `logoDark`, `favicon`, `defaultSocialImage`) with runtime consumption for logo/title/favicon surfaces.
- Settings auditability and rollback baseline delivered with persisted settings history snapshots, changed-fields tracking, and rollback endpoint + CMS UI action.
- Content schema version advanced to v3 with migration for `settingsHistory` initialization.
