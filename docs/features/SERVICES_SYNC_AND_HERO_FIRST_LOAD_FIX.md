# Services Sync and Hero First-Load Fix

## Root causes

1. **Premium service routes bypassed canonical CMS/API-backed service content.**
   - `service-design` and `service-web` rendered static page components instead of the dynamic `ServiceDetailPage` that reads from `fetchPublicServices()` + repository sync.
   - Result: CMS updates could persist in backend but remain invisible on those public detail routes.

2. **Homepage hero content hydration was blocked behind media fetch completion.**
   - `HomePageContent` used `Promise.allSettled([fetchPublicMediaFiles(), fetchPublicPageContent()])` and only applied page content after both requests settled.
   - Result: when media was delayed, valid saved hero slides were not applied immediately on first load.

## Services canonical path (CMS → API → Site)

- CMS save path: `saveBackendService(payload)` then authoritative `fetchBackendServices()` refresh.
- Backend canonical persistence: `POST /content/services` → `contentService.saveService(...)` → repository state write.
- Public canonical read path: `GET /content/public/services`.
- Public detail rendering now always uses `ServiceDetailPage`, including legacy premium routes (`design-branding`, `web-development`).

## Hero first-load initialization strategy

- `HomePageContent` now hydrates **page content independently** from media synchronization.
- `fetchPublicPageContent()` applies immediately to repository and React state.
- `fetchPublicMediaFiles()` runs in parallel and only updates media repository/revision.
- This guarantees hero slides from CMS/page-content appear as soon as authoritative page content arrives, without waiting for media round-trip completion.

## Fallback override rules (updated)

- Canonical backend content remains authoritative.
- Route-level static service page overrides were removed for premium routes; all service details now flow through canonical public services data.
- Hero page-content application is no longer delayed by unrelated media fetch timing.

## Synchronization guarantees

- Service changes saved in CMS propagate through backend and are visible on public detail routes for all service slugs (including premium legacy slugs).
- Hero slide data saved in CMS and returned by public page-content endpoint hydrates the homepage hero on first load path without waiting on media endpoint completion.
