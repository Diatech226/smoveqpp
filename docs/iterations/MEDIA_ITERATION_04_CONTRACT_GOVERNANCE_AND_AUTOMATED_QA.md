# Media Iteration 4 — Contract Governance and Automated QA

Date: 2026-03-24

## Scope delivered

Iteration 4 focuses on regression resistance and operator trust for media renderability contracts across Blog and Projects.

### Protected contract surfaces

The following contract path is now explicitly protected by automated tests and diagnostics:

`CMS save shape -> persisted content -> public API response -> resolver output -> render-safe image src`

## Critical media fields (public renderability)

### Blog (published)

Critical for public card/detail rendering:

- `mediaRoles.featuredImage` (if present)
- `mediaRoles.coverImage` (if present)
- `mediaRoles.cardImage` (if present)
- fallback: `featuredImage`

Canonical render source is derived using the above precedence. If canonical source is unresolved, the public adapter uses deterministic fallback and diagnostics flag the risk.

### Projects (published)

Critical for public rendering:

- Card image canonical source (`mediaRoles.cardImage` -> `mediaRoles.heroImage` -> `mediaRoles.coverImage` -> `featuredImage` -> `mainImage`)
- Hero image canonical source (`mediaRoles.heroImage` -> `mediaRoles.coverImage` -> `mediaRoles.cardImage` -> `mainImage` -> `featuredImage`)
- Gallery list (`mediaRoles.galleryImages` or fallback `images`)

If references are unresolved, render remains deterministic/safe while diagnostics flag card/hero/gallery risk.

## What counts as unresolved

A media reference is unresolved when it is `media:asset-id` and the target asset is not currently active:

- `missing`: asset id does not exist
- `archived`: asset exists but is archived

`active` references are considered valid.

## Diagnostics strengthened

`contentService.getContentHealthSummary()` now includes:

- `quality.unresolvedPublishedCriticalMedia.blogCard`
- `quality.unresolvedPublishedCriticalMedia.projectCard`
- `quality.unresolvedPublishedCriticalMedia.projectHero`
- `quality.unresolvedPublishedCriticalMedia.projectGallery`
- `quality.unresolvedPublishedCriticalMedia.archivedReferencedByPublished`

This reduces noise versus global unresolved counts and maps directly to published render risk.

## Automated QA protections added

## Blog contract tests

- direct URL featured image stays renderable on card contract
- `media:asset-id` featured image resolves on card contract
- `media:asset-id` featured image resolves on detail contract
- unresolved featured media is deterministic and never leaks raw `media:` into render src

## Project contract tests

- direct URL card image remains renderable
- `media:asset-id` card image resolves for card contract
- `media:asset-id` hero image resolves for detail contract
- gallery media references resolve in declared order
- unresolved gallery/media references remain deterministic and render-safe

## Health/diagnostics tests

- health summary exposes unresolved published critical media counts
- archived-vs-missing published references are detectable
- dashboard readiness snapshot uses published-critical media counts when available

## CI-friendly hook

Added npm script:

- `npm run test:media-contract`

This script runs targeted media contract + diagnostics regression tests so media drift can fail fast in CI.

## Out of scope (still beyond Iteration 4)

- DAM metadata workflow redesigns
- archive browser UX redesign
- role/permission system redesign
- broad CMS visual redesign

