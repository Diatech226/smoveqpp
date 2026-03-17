# Iteration 4 — Taxonomies, Service Detail CMS Authority, Brand Assets, and Settings Auditability

## Delivered scope

### B2 — Blog taxonomy governance baseline
- Added managed taxonomy baseline in settings (`taxonomySettings.blog`) with deterministic managed categories and managed tags.
- Enforced blog taxonomy normalization server-side:
  - categories normalized case-insensitively to managed values when matched;
  - tags normalized and de-duplicated, with managed-tag enforcement enabled by default to prevent drift.
- Added public taxonomy endpoint (`GET /content/public/blog/taxonomy`) for future editorial UX integrations.
- CMS blog editor now clarifies managed taxonomy usage and surfaces managed category/tag guidance.

### S2 — Service detail CMS authority (phased baseline)
- Extended service contract with CMS-governed detail fields:
  - `overviewDescription`
  - `ctaTitle`, `ctaDescription`, `ctaPrimaryLabel`, `ctaPrimaryHref`
  - `processTitle`, `processSteps`
- Extended CMS service editor to edit these fields without changing public visual design.
- Updated service detail rendering so process sections can consume CMS-managed process content with safe fallback values.

### G1/G2 continuation — Settings authority with brand assets
- Extended settings brand media contract with:
  - `logo`
  - `logoDark`
  - `favicon`
  - `defaultSocialImage`
- Added CMS settings inputs for these brand assets (URL or `media:<id>` references).
- Public runtime authority improvements:
  - navigation logo reads `siteSettings.brandMedia.logo` with fallback;
  - footer brand logo reads `siteSettings.brandMedia.logo` with fallback;
  - document title and favicon now consume public settings where available.

### Settings auditability + rollback baseline
- Added persisted `settingsHistory` in content state.
- Added settings change history recording on each save:
  - `changedBy`
  - `changedAt`
  - `changedFields`
  - `changeSummary`
  - immutable `snapshot`
- Added rollback endpoint and service behavior:
  - `POST /content/settings/:versionId/rollback`
- CMS now exposes settings history and allows baseline rollback actions.

## Compatibility and safety
- Backward compatibility maintained through normalization and defaulting.
- Content schema advanced to v3 with migration path that initializes settings history.
- Public UI layout and design language intentionally preserved.

## Remaining for next iteration
- Full managed-taxonomy CRUD UI (creation/retirement workflow, usage analytics).
- Expanded service page CMS coverage beyond currently wired sections.
- Richer settings history filtering/comparison UI.
- Optional signed/immutable audit evidence export for compliance-heavy environments.
