# Iteration 2 — Public IA, Routing, and SEO Hardening (Execution)

## Canonical public routes

Canonical hash-path routes are now:

- `#/` → home
- `#/blog` and `#/blog/:slug`
- `#/projects` and `#/projects/:slug`
- `#/services` and `#/services/:slug`
- `#/about`
- `#/contact`
- `#/portfolio`

## Route compatibility and normalization

Backward-compatible aliases are still accepted and normalized to canonical routes:

- `#home` / empty hash → `#/`
- `#blog/:slug` → `#/blog/:slug`
- `#project-:slug` → `#/projects/:slug`
- `#service/:slug`, `#service-:slug`, `#/services/:slug` → `#/services/:slug`
- CMS root aliases normalize to `#/cms`
- `#/about` and `#apropos` resolve to the same about page (`apropos` page key)

## Metadata strategy

A centralized metadata layer now handles:

- page title template and site title composition
- description handling
- canonical URL generation from normalized route paths
- Open Graph and Twitter metadata with social image fallback

Static/public pages receive metadata from route-level defaults, while dynamic detail pages (blog/project/service) override with content-specific metadata.

## CTA routing conventions

CTA intent mapping is standardized through shared helpers:

- service inquiry CTA → `#/contact`
- project inquiry CTA → `#/contact`
- about/team CTA → `#/portfolio`
- content discovery CTAs use canonical detail routes:
  - blog cards → `#/blog/:slug`
  - project cards → `#/projects/:slug`
  - service cards → `#/services/:slug`

## What was normalized in Iteration 2

- Canonical route helpers introduced for public pages and details.
- Route resolver hardened with path-style route aliases and deterministic normalization hashes.
- Metadata logic centralized and reused by app shell and detail pages.
- CTA destination consistency enforced for contact/inquiry intents.
- Public page links migrated toward canonical route builders.

## Remaining items for future iterations

- Full migration away from hash routing to history/SSR-friendly URLs.
- Dedicated contact page template (currently contact remains home-section behavior).
- Expanded structured data schema (`JSON-LD`) for blog/project/service entities.
