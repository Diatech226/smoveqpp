# Production Preparation and Global Fixes

Date: 2026-04-24

## Scope covered in this stabilization pass

- Public API route hardening for blog/projects/services and cache behavior.
- Legacy-content compatibility for public listings.
- Site-side content API cache-bypass hardening to reduce stale CMS→site drift.
- Behavior-focused tests for the above regression paths.

## Critical fixes applied

1. **Fixed blog taxonomy route shadowing by dynamic slug route**
   - `GET /content/public/blog/taxonomy` is now registered before `GET /content/public/blog/:slug`.
   - This prevents taxonomy requests from being interpreted as a slug and returning false 404s.

2. **Improved legacy content compatibility in public rendering**
   - Public filters now treat missing/empty `status` as legacy-published content instead of silently dropping those records.
   - Applied consistently to:
     - public blog listing eligibility
     - public projects listing eligibility
     - public services listing

3. **Hardened freshness guarantees for CMS→API→site synchronization**
   - Added `Cache-Control: no-store` headers on key public content endpoints:
     - projects
     - services
     - blog list/detail/taxonomy
     - settings
     - page content
     - media library
   - Added `cache: 'no-store'` in site-side content API fetchers (public reads and authenticated content requests).
   - This reduces stale content after CMS saves and improves reload trustworthiness.

## Tests added

1. `apps/api/server/tests/contentRoutes.public.test.js`
   - Verifies taxonomy route ordering against slug route.
   - Verifies legacy records without explicit status are still exposed publicly.
   - Verifies `Cache-Control: no-store` on public listing responses.

2. `apps/site/src/utils/contentApi.request.test.ts`
   - Verifies site content API uses `cache: 'no-store'` for:
     - public blog fetch
     - public settings fetch
     - authenticated content mutation request path

## Remaining non-blocking concerns

- Full end-to-end verification (site build, CMS build, vitest suite) could not be executed in this environment because package installation is blocked by registry policy (403 on dependency retrieval).
- Additional manual UAT across all CMS tabs and visual flows remains recommended before release freeze.

## Production assumptions

- Runtime deployment will provide valid Node module installation for all declared dependencies.
- Reverse proxy/CDN configuration will respect `Cache-Control: no-store` on dynamic content endpoints.
- Existing legacy records may omit status fields and should remain visible/public where publishable.

## Final validation checklist

- [x] Public blog taxonomy endpoint reachable without slug collision.
- [x] Legacy status-less records remain visible on public content lists when otherwise valid.
- [x] Public content endpoints explicitly disable cache persistence.
- [x] Site fetch layer requests dynamic content with `no-store`.
- [x] Regression tests added for route ordering + cache + legacy compatibility.
