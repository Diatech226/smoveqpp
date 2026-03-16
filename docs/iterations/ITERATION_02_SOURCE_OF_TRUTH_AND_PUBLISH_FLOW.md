# Iteration 02 — Source of Truth & Publish Flow Hardening

## Objective
Make backend API the explicit authoritative source in production paths and reduce silent divergence.

## Scope
- CMS save/load fallback behavior.
- Public fetch fallback behavior.
- Publish workflow clarity.

## Affected domains
- Blog, Projects, Services, Home content, CMS settings.

## Key bugs to fix
1. Silent local fallback on remote failure can mask backend outages and create data divergence.
2. CMS bootstrapping backfills remote from local when backend empty without explicit operator confirmation.
3. `instantPublishing` setting is persisted but not operationally enforced in publish flow.

## Data/model fixes
- Introduce explicit runtime mode:
  - `authoritative_remote` (production default)
  - `degraded_local` (visible warning banner, read/write semantics documented)
- Gate local-to-remote hydration behind manual admin action.
- Enforce `instantPublishing` semantics in blog transition controls.

## Expected deliverables
- Deterministic fallback policy document + implementation.
- CMS UI warning state when running degraded/local mode.
- Controlled migration action for seeding backend from local snapshot.

## Risk level
**High** — touches reliability semantics and operational behavior.

## Validation criteria
- Simulate backend outage; CMS must clearly show degraded mode and avoid silent inconsistencies.
- Restore backend and reconcile without data loss.
- Verify publish transition behavior reflects settings.
