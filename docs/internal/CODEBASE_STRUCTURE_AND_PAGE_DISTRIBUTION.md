# CODEBASE STRUCTURE AND PAGE DISTRIBUTION

## Executive summary
This monorepo now has clean application boundaries:

- `apps/site`: public website only (public pages and public-facing auth/account flows).
- `apps/cms`: CMS/admin application only (dashboard sections and CMS auth/account flows).
- `apps/api`: backend API only.
- `packages/shared`: shared contracts/schemas/validators only.

A boundary cleanup pass removed legacy CMS UI files from `apps/site/src/components/cms/*` so the CMS UI only exists in `apps/cms`.

---

## Simple ownership map

- **Public site pages are here:** `apps/site/src/components`, `apps/site/src/features/marketing`, `apps/site/src/features/app-shell`.
- **CMS pages/sections are here:** `apps/cms/src/CMSApp.tsx`, `apps/cms/src/components/cms`, `apps/cms/src/components/cms/dashboard`.
- **Shared code is here:** `packages/shared/src/contentContracts.ts`, `packages/shared/src/contentSchemas.ts`.

---

## Current workspace boundaries

### 1) Site app (`apps/site`)
Owns:
- Public pages (home, projects, portfolio, services, blog, contact/about).
- Public route resolution and shell rendering.
- Public content readers/adapters.
- Public auth/account UX (with CMS redirect behavior, not embedded CMS UI).

Does **not** own:
- CMS dashboard sections/components.
- CMS admin primitives.
- CMS media/blog/projects/content/users/settings section UIs.

### 2) CMS app (`apps/cms`)
Owns:
- CMS app shell and dashboard layout.
- CMS sections: overview, projects, blog, media, content, users, settings.
- CMS routing and access gating.
- CMS auth/account/login/register pages.

Does **not** depend on:
- Internal UI/component files from `apps/site`.

### 3) API app (`apps/api`)
Owns:
- Auth routes/controllers/services.
- Content routes/controllers/services.
- Persistence/security/runtime wiring.

### 4) Shared package (`packages/shared`)
Owns:
- Shared content contracts.
- Shared schema/types.
- Shared validation helpers.

Does **not** contain:
- Site-only UI.
- CMS-only UI.

---

## Public site page distribution

| Page | Route pattern | Owner file |
|---|---|---|
| Home | `#home` (+ section hashes) | `apps/site/src/features/marketing/home/HomePageContent.tsx` |
| Projects list | `#projects` | `apps/site/src/components/ProjectsPage.tsx` |
| Project detail | `#project-{slugOrId}` | `apps/site/src/components/ProjectDetailPage.tsx` |
| Services hub | `#services-all` | `apps/site/src/components/ServicesHubPage.tsx` |
| Premium service pages | `#service-design`, `#service-web` | `apps/site/src/components/services/DesignBrandingPage.tsx`, `apps/site/src/components/services/WebDevelopmentPage.tsx` |
| Generic service detail | `#/services/{slug}`, `#service-{slug}` | `apps/site/src/components/services/ServiceDetailPage.tsx` |
| Portfolio | `#portfolio` | `apps/site/src/components/PortfolioPage.tsx` |
| Blog list | `#blog` | `apps/site/src/components/BlogPageEnhanced.tsx` |
| Blog detail | `#blog/{slug}` | `apps/site/src/components/BlogDetailPage.tsx` |
| About | `#apropos` | `apps/site/src/imports/APropos.tsx` |
| Login/Register/Account | `#login`, `#register`, `#account` | `apps/site/src/components/auth/*` |

---

## CMS page/section distribution

| CMS page/section | Route pattern | Owner file |
|---|---|---|
| Login | `#login` | `apps/cms/src/CMSLoginPage.tsx` |
| Register | `#register` | `apps/cms/src/CMSRegisterPage.tsx` |
| Account | `#account` | `apps/cms/src/CMSAccountPage.tsx` |
| Dashboard shell | `#cms` | `apps/cms/src/components/cms/CMSDashboard.tsx` |
| Projects/Services/Blog/Media/Content sections | `#cms/{section}` | `apps/cms/src/components/cms/dashboard/CMSMainSections.tsx` |
| Users/Settings sections | `#cms/users`, `#cms/settings` | `apps/cms/src/components/cms/CMSDashboard.tsx` |

---

## What was moved/cleaned in this boundary fix

Removed from `apps/site` as CMS-only legacy artifacts:
- `apps/site/src/components/cms/CMSAppShell.tsx`
- `apps/site/src/components/cms/adminPrimitives.tsx`
- `apps/site/src/components/cms/CMSDashboard.tsx`
- `apps/site/src/components/cms/dashboard/*`
- `apps/site/src/CMS_COMPLETE.md`

Retained in `apps/cms` as CMS source of truth:
- `apps/cms/src/components/cms/*`
- `apps/cms/src/components/cms/dashboard/*`

---

## Boundary rules to keep

- `apps/site` imports only from:
  - `apps/site/src/*`
  - `packages/shared/*`
- `apps/cms` imports only from:
  - `apps/cms/src/*`
  - `packages/shared/*`
- No direct app-to-app internal imports.
- Shared package is contracts/schemas/validators only.
