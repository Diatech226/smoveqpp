# Iteration C — Shared Validation / Reference Contract Library

_Date: 2026-03-19_

## Implemented contracts

- **Shared slug contract**
  - `normalizeSlug` + `isValidSlug` extracted for frontend usage in `src/shared/contentContracts.ts`.
  - Matching backend contract extracted in `server/utils/contentContracts.js`.
  - Migrated high-value callsites: blog adapter, project card adapter, service routing, project/service repositories, and backend content service validators.

- **Shared media reference contract**
  - Standardized primitives: `isMediaReference`, `mediaIdFromReference`, `toMediaReference`, and `isValidMediaFieldValue`.
  - Media contract now handles `media:<id>` parsing with optional media lookup callbacks and explicit inline-text fallback mode.
  - Reused in CMS form validation and frontend repositories; backend content service now validates media links through the shared contract helper.

- **Shared URL/content href contract**
  - Baseline primitives: `isHttpUrl`, `isValidOptionalHttpUrl`, and `isValidContentHref`.
  - Reused in CMS dashboard validation and backend content service URL checks.

- **Shared lightweight content validation helpers**
  - `requiredTrimmed`, `hasMinTrimmedLength`, and `normalizeStringArray` introduced to reduce repeated trimming/array cleanup logic.
  - Adopted in project/service repositories and backend project/service normalizers.

## Drift-risk reductions

- Removed repeated slug regex/normalization implementations from multiple frontend modules.
- Reduced frontend/backend media-reference drift by introducing near-identical reusable contracts in each runtime boundary.
- Standardized CTA/project/settings URL acceptance behavior around a shared baseline helper set.

## Remaining scope for next iteration

- Continue migrating monolithic CMS dashboard in-file validation to smaller contract-centric modules.
- Expand shared helpers to taxonomy and publish-readiness checks where business rules are still duplicated in many callsites.
- Evaluate introducing a single isomorphic package for backend + frontend contract sharing once build/runtime boundaries are simplified.
