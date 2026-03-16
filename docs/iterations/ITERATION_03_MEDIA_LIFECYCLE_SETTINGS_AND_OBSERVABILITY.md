# Iteration 3 — Media Lifecycle, Settings Authority, and CMS Observability

## Scope delivered

This iteration implemented an operational baseline focused on:

1. Safe media lifecycle guardrails.
2. Settings authority split and enforcement.
3. CMS/public synchronization observability.
4. Source-of-truth divergence visibility.

## Media safe-delete / replace policy

- Media deletion is now a safe archive operation by default (soft-delete semantics).
- In-use media cannot be archived/deleted; server blocks with `MEDIA_IN_USE`.
- Reference coverage includes blog, projects, home content, services, and settings brand-media fields.
- Admin workflows can inspect references through dedicated API coverage (`/media/:id/references`).
- Replace-in-place endpoint (`/media/:id/replace`) allows updating an existing media id without breaking existing `media:<id>` references.

## Settings authority split

Settings are normalized into:

- `siteSettings`
  - `siteTitle`
  - `supportEmail`
  - `brandMedia` (logo/favicon/defaultSocialImage readiness)
- `operationalSettings`
  - `instantPublishing`

Backward compatibility is preserved via mirrored top-level fields (`siteTitle`, `supportEmail`, `instantPublishing`) so existing clients continue to work.

## Enforcement / consumers

- `instantPublishing` remains server-enforced for publish transitions.
- Site settings (`siteTitle`, `supportEmail`) are now exposed to public runtime via `/content/public/settings`.
- Footer now consumes public settings with graceful fallback when backend is unavailable.

## Observability and divergence signals

- Added `/content/sync-diagnostics` baseline diagnostics endpoint.
- Diagnostics include invalid media references and section counts.
- CMS dashboard surfaces synchronization diagnostics warnings and degraded backend visibility.
- Blocking reasons are more explicit for media archive/delete when references are detected.

## Remaining for next iteration

- Add richer diagnostics history and timestamps for longitudinal operator tracking.
- Expand brand media consumers beyond footer/title baseline.
- Add explicit UI affordances for media replace action (API is in place).
- Add optional hard-delete workflow behind stronger admin safeguards and retention policy.
