# Iteration 02 — Source of Truth & Publish Flow Hardening

## Objective
Make backend API the explicit authoritative source in production paths and reduce silent divergence.

## Implemented behavior

### Runtime modes
- `authoritative_remote`: backend/API reachable and CMS operations rely on remote persistence.
- `degraded_local`: one or more CMS backend reads/writes failed; CMS shows an explicit warning banner and scopes fallback semantics as temporary/local.

### Deterministic fallback policy
- CMS now flags degraded mode when backend fetch/save fails (blog, projects, services, media, page content, settings).
- Local fallback remains read-oriented for continuity, but degraded status is explicit and persistent in-session.
- Home content save no longer silently persists locally when backend write fails.

### Controlled hydration
- Automatic project/service backfill from local snapshot at bootstrap was removed.
- Backend seeding from local snapshot is now manual via admin settings action: **Hydrater backend depuis local**.

### Publish flow hardening
- Backend now enforces `instantPublishing` during blog publish save/transition.
- CMS publish controls honor `instantPublishing` by disabling publish actions when the setting is off.

### Public fetch hardening
- Public API utilities now throw explicit errors instead of returning silent `null`.
- Public views log source-unavailability warnings and keep current repository snapshot without pretending fetch success.

## Validation criteria mapping
- Backend outage in CMS -> degraded banner visible + warnings list.
- Backend restore -> manual hydration path allows explicit reconciliation.
- Publish transitions now aligned with `instantPublishing` setting at API + UI layers.
