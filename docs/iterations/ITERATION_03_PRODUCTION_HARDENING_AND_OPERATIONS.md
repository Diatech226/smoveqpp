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
