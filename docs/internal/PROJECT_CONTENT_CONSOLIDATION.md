# Project content consolidation (CMS authoritative model)

## Source of truth

- Canonical project records are stored in `apps/api/server/data/content.json` under `projects`.
- CMS read/write/delete APIs (`/api/v1/content/projects*`) operate exclusively on that canonical store.
- Public site project endpoints (`/api/v1/content/public/projects`) now read from the same canonical store.

## One-time consolidation behavior

- `ContentService.listProjects()` now executes `seedProjectsFromLegacy()` before returning records.
- `seedProjectsFromLegacy()` imports legacy site-only projects using deterministic matching:
  1. slug match
  2. id match
- Only missing records are imported; existing canonical records are preserved.
- Import writes a migration telemetry entry in `migrationHistory` with counts for imported and skipped records.

## Drift prevention

- Re-running the project import is idempotent (no duplicate projects by slug/id).
- CMS edit/delete remains authoritative because imported projects are persisted as regular canonical project records.
- Public site and CMS both read/write the same normalized project contract through `ContentService`.
