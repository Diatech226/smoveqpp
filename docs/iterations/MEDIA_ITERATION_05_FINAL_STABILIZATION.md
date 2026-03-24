# Media Iteration 05 — Final Stabilization Pass

## Scope completed
- Hardened media reference resolution to treat archived assets as unresolved fallbacks (instead of rendering stale URLs).
- Aligned CMS preview status to distinguish archived references (`Archivé`) from missing references (`Non résolu`).
- Stabilized Blog canonical SEO social image output so `media:asset-id` values are resolved to renderable URLs.
- Fixed Blog edit/update role drift: replacing featured image now realigns `mediaRoles.coverImage` and `mediaRoles.cardImage` to the updated featured media reference.
- Updated dashboard readiness aggregation to include `archivedReferencedByPublished` in unresolved media totals.

## Reliability impact
- Reduces refresh-time rendering failures caused by stale/archived media references.
- Keeps CMS preview feedback consistent with public resolver behavior.
- Prevents mismatch between edited Blog featured images and role-based rendering precedence.
- Improves trustworthiness of CMS media diagnostics for launch readiness decisions.

## Remaining limitations
- Public media hydration still depends on API availability; when unavailable, local repository snapshot fallback remains in place by design.
- Front-end currently marks archived references as unresolved but does not provide an explicit archive-restore action from preview cards.
