# Iteration 03 — Production Hardening, Tests, and Operations

## Objective
Raise confidence for production through validation, observability, and runbook-complete operations.

## Scope
- Schema validation hardening.
- End-to-end tests for CRUD-to-render.
- Media safety and operational checks.

## Affected domains
- All content domains + auth/admin operations.

## Key bugs to fix
1. Weak field-level validation (icons, URLs, date constraints, media reference existence).
2. Missing test coverage for end-to-end CMS create/update reflected on public pages.
3. Media deletion can orphan references.

## Data/model fixes
- Add explicit validators (zod/custom) at CMS submit and backend service boundaries.
- Add reference checks before deleting media.
- Add regression tests for:
  - Blog publish contract
  - Project detail renderability with full model
  - Service icon/color validity
  - Home content persistence

## Expected deliverables
- Validation matrix + implementation.
- E2E/integration test suite updates.
- Media safe-delete guardrails.
- Runbook updates for content recovery and rollback drills.

## Risk level
**Medium** — broad but incremental and test-driven.

## Validation criteria
- CI green on new contract + flow tests.
- Manual smoke across CMS and public pages.
- Runbook dry-run for backup/restore + rollback.

## Implementation notes (completed)

### Validation hardening matrix
- **Blog (CMS + backend):** slug pattern enforcement, valid publish date requirement, featured/social image media reference validation, and publishability guardrail aligned with required render fields.
- **Projects (CMS + backend):** strict 4-digit year, URL validation for external/case-study links, media reference integrity for featured/gallery assets, and slug format checks.
- **Services (CMS + backend):** icon whitelist (`palette`, `code`, `megaphone`, `video`, `box`) and gradient color contract (`from-[#hex] to-[#hex]`) enforcement.
- **Home content (CMS + backend):** hero title required and about-image validated as URL or existing `media:<id>` reference.
- **Media entities (backend):** upload date and URL shape validation tightened for stored assets.

### Media safe-delete guardrails
- Added cross-domain media reference discovery in content service (blog/project/home).
- API now blocks media deletion with `409 MEDIA_IN_USE` when any content still references the asset.
- CMS now surfaces explicit admin feedback when delete is blocked due to references.

### Regression coverage added
- Backend content service tests for invalid blog/project payload rejection, service icon/color contract enforcement, home content media reference validation, and media reference detection.
- Frontend service rendering contract tests for invalid color fallback.
