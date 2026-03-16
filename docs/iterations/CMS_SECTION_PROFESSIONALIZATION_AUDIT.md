# CMS Section Professionalization Audit

This file tracks implementation progress against CMS professionalization iterations.

## Iteration status snapshot

- Iteration 1: completed.
- Iteration 2: completed baseline governance and public detail contracts.

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
