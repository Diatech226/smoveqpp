# CMS ↔ Public Site Professionalization Iterations

This folder tracks the incremental hardening of the CMS and public site content contract.

## Scope
- CMS create/edit flows for Blog, Projects, Services, Home page content, Media.
- End-to-end path: CMS form → repository → API/service → persistence → public rendering.
- Source-of-truth alignment (backend API vs local storage seeds/fallbacks).

## Execution mode
1. Audit first (facts from current codebase).
2. Ship in small, reversible iterations.
3. Validate each iteration with explicit acceptance criteria.
4. Avoid visual redesign; focus on data contracts and reliability.

## Iteration index
- `CMS_SITE_AUDIT.md` — current-state findings and prioritized backlog.
- `ITERATION_01_CONTENT_CONTRACT_ALIGNMENT.md` — fix critical create/form vs model mismatches.
- `ITERATION_02_SOURCE_OF_TRUTH_AND_PUBLISH_FLOW.md` — harden data flow and publishing behavior.
- `ITERATION_03_PRODUCTION_HARDENING_AND_OPERATIONS.md` — validation, observability, and release readiness.
- `PRODUCTION_READINESS_ROADMAP.md` — staged path to production readiness.
