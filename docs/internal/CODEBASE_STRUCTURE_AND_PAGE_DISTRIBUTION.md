# CODEBASE STRUCTURE AND PAGE DISTRIBUTION

## 1. Executive summary
This repository is a **monorepo** with four active workspaces: `apps/site` (public website), `apps/cms` (admin CMS SPA), `apps/api` (Node/Express backend API), and `packages/shared` (shared contracts/types/helpers).

At runtime, the flow is:
- **Public site (`apps/site`)** renders pages with hash-based routing (`#home`, `#blog/...`, `#/services/...`) and fetches published content from API public endpoints.
- **CMS (`apps/cms`)** is a separate frontend app (different Vite app) with its own hash navigation (`#cms`, `#cms/blog`, etc.) and authenticated API calls.
- **API (`apps/api`)** exposes auth + content endpoints for both public and CMS clients.
- **Shared package (`packages/shared`)** provides cross-app schema/contracts and validation helpers, re-exported inside both frontend apps.

---

## 2. Folder structure overview

### Monorepo/workspace root
- `apps/site/` → public website frontend (Vite + React SPA).
- `apps/cms/` → CMS/admin frontend (Vite + React SPA).
- `apps/api/` → Express backend (auth + content APIs).
- `packages/shared/` → shared domain contracts/schema utilities used by both frontends.
- `scripts/` → monorepo orchestration (`dev`, `lint`, `typecheck`, backup/restore).
- `tests/e2e/` → end-to-end flows.

### Public site (`apps/site/src`) important subareas
- `main.tsx` + `App.tsx` → application boot + top-level state/context.
- `app-routing/` → hash route parsing and route resolution.
- `features/app-shell/` → shell/error/loading wrappers + page rendering switch.
- `components/` → public page components (blog/project/service/detail/etc.).
- `features/marketing/home/` → homepage section composition.
- `repositories/` + `data/` → local content repositories + seed fallbacks.
- `utils/publicContentApi.ts` + `utils/contentApi.ts` → API clients.

### CMS (`apps/cms/src`) important subareas
- `main.tsx` + `CMSApp.tsx` → boot and top-level CMS gatekeeping.
- `cmsRouting.ts` → CMS hash route/section resolution.
- `components/cms/CMSDashboard.tsx` → primary CMS dashboard/section controller.
- `components/cms/dashboard/` → section UI modules (projects/blog/media/content/etc.).
- `repositories/` + `data/` → local repositories + seed fallback.
- `utils/contentApi.ts` + `utils/authApi.ts` → authenticated CMS API client.

### API (`apps/api/server`) important subareas
- `index.js` → server bootstrap.
- `app.js` → Express app composition and middleware mounting.
- `routes/authRoutes.js` → auth/account/admin-user endpoints.
- `routes/contentRoutes.js` → public + CMS content endpoints.
- `services/` + `repositories/` → business logic + persistence adapters.

---

## 3. Entry points

### Public site entry
- `apps/site/src/main.tsx`: React root mount.
- `apps/site/src/App.tsx`: wraps app in `AuthProvider`, computes current hash route, renders through `AppPageRenderer`.
- `apps/site/src/features/app-shell/AppPageRenderer.tsx`: core route-to-page component switch.

### CMS entry
- `apps/cms/src/main.tsx`: React root mount.
- `apps/cms/src/CMSApp.tsx`: wraps with `AuthProvider`, applies auth/capability gates, then renders `CMSDashboard` inside `CMSAppShell`.
- `apps/cms/src/cmsRouting.ts`: CMS-specific hash page/section logic.

### API entry
- `apps/api/server/index.js`: bootstrap (env checks, mongo connect, auth service construction, server listen).
- `apps/api/server/app.js`: middleware/security/session setup, mounts auth/content routes.

---

## 4. Public site page map

> Routing model is **hash-based/manual resolution** (not file-based router).

| Public page/section | Route / pattern | Main file | Notes |
|---|---|---|---|
| Home (single-page sections) | `#home` and section hashes (`#services`, `#about`, `#portfolio`, `#contact`) | `apps/site/src/features/marketing/home/HomePageContent.tsx` | Home is one long page with anchored sections. |
| Projects list | `#projects` | `apps/site/src/components/ProjectsPage.tsx` | Fetches published projects and renders grid/filter/search. |
| Project detail | `#project-{slugOrId}` | `apps/site/src/components/ProjectDetailPage.tsx` | Selected by `AppPageRenderer` dynamic `project-` branch. |
| Services hub/list | `#services-all` | `apps/site/src/components/ServicesHubPage.tsx` | General services index/grid. |
| Premium service detail: Design | `#service-design` | `apps/site/src/components/services/DesignBrandingPage.tsx` | Reserved route mapped from `design-branding` slug. |
| Premium service detail: Web | `#service-web` | `apps/site/src/components/services/WebDevelopmentPage.tsx` | Reserved route mapped from `web-development` slug. |
| Generic service detail | `#/services/{slug}` or `#service-{slug}` | `apps/site/src/components/services/ServiceDetailPage.tsx` | Resolver normalizes to `service-{slug}`. |
| Portfolio page | `#portfolio` | `apps/site/src/components/PortfolioPage.tsx` | Separate page route in addition to home section usage. |
| Blog list | `#blog` | `apps/site/src/components/BlogPageEnhanced.tsx` | Reads blog contract from source and filters client-side. |
| Blog detail | `#blog/{slug}` | `apps/site/src/components/BlogDetailPage.tsx` | Resolver converts to internal `blog-{slug}` page key. |
| About page | `#apropos` | `apps/site/src/imports/APropos.tsx` (rendered via `AppPageRenderer`) | Distinct page route; separate from home “about” section. |
| Auth login | `#login` | `apps/site/src/components/auth/LoginPage.tsx` | Guarded by CMS availability/auth state. |
| Auth register | `#register` | `apps/site/src/components/auth/RegisterPage.tsx` | Also guarded by registration flag. |
| Account | `#account` | `apps/site/src/components/auth/AccountPage.tsx` | Requires auth; else redirected to login/auth-loading states. |

### Where public route logic lives
- Parse/resolve: `apps/site/src/app-routing/routeResolver.ts`
- Runtime sync with URL hash: `apps/site/src/app-routing/useHashNavigation.ts`
- Page render dispatch: `apps/site/src/features/app-shell/AppPageRenderer.tsx`
- Guard rules: `apps/site/src/app-routing/guards.ts`

---

## 5. CMS page/section map

> CMS also uses **hash-based/manual routing**, but with section-level navigation within one dashboard component.

| CMS section | Route/access pattern | Main file | Notes |
|---|---|---|---|
| CMS login | `#login` | `apps/cms/src/CMSLoginPage.tsx` | Entry when unauthenticated. |
| CMS register | `#register` | `apps/cms/src/CMSRegisterPage.tsx` | Conditional on registration flag. |
| CMS account | `#account` | `apps/cms/src/CMSAccountPage.tsx` | Separate account page path. |
| Dashboard overview | `#cms` or `#cms/overview` | `apps/cms/src/components/cms/CMSDashboard.tsx` | `currentSection = overview`. |
| Projects admin | `#cms/projects` | `apps/cms/src/components/cms/dashboard/CMSMainSections.tsx` + `CMSDashboard.tsx` | Section component selected by `currentSection`. |
| Services admin | `#cms/services` | `apps/cms/src/components/cms/dashboard/CMSMainSections.tsx` + `CMSDashboard.tsx` | Managed as section state. |
| Blog admin | `#cms/blog` | `apps/cms/src/components/cms/dashboard/CMSMainSections.tsx` + `CMSDashboard.tsx` | Includes editor workflows/status transitions. |
| Media library | `#cms/media` | `apps/cms/src/components/cms/dashboard/CMSMainSections.tsx` + `CMSDashboard.tsx` | Upload, reference checks, governance states. |
| Page content | `#cms/content` | `apps/cms/src/components/cms/dashboard/CMSMainSections.tsx` + `CMSDashboard.tsx` | Homepage content editing. |
| Users | `#cms/users` | `apps/cms/src/components/cms/CMSDashboard.tsx` | Admin users/audit within dashboard file. |
| Settings | `#cms/settings` | `apps/cms/src/components/cms/CMSDashboard.tsx` | Global settings + history/rollback in dashboard file. |

### Where CMS route logic lives
- Main hash resolver/navigation state: `apps/cms/src/cmsRouting.ts`
- App-level auth gate: `apps/cms/src/CMSApp.tsx`
- Section rendering + menu IDs: `apps/cms/src/components/cms/CMSDashboard.tsx`

---

## 6. Shared code map

| Shared area | Location | Used by | Notes |
|---|---|---|---|
| Canonical content contracts/helpers | `packages/shared/src/contentContracts.ts` | Site + CMS (re-export wrappers) | Slug/media/url validation helpers. |
| Canonical domain schemas/types | `packages/shared/src/contentSchemas.ts` | Site + CMS (via `domain/contentSchemas.ts` re-export) | Blog/project/service/media interfaces + type guards. |
| Frontend-level wrappers over shared contracts | `apps/site/src/shared/contentContracts.ts`, `apps/cms/src/shared/contentContracts.ts` | Site + CMS | Both simply re-export from `packages/shared`. |
| API contracts (content/auth client DTOs) | `apps/site/src/utils/contentApi.ts` and `apps/cms/src/utils/contentApi.ts` + `authApi.ts` twins | Site + CMS | Large duplicated files; same API methods in both apps. |
| Repository model logic | `apps/site/src/repositories/*`, `apps/cms/src/repositories/*` | Site + CMS | Mostly parallel duplicated repository implementations. |
| API-side content contract utilities | `apps/api/server/utils/contentContracts.js` | API server only | Backend contract validation path not imported from `packages/shared`. |

### Separation assessment of shared code
- **Partially mixed / partially clean**.
- Clean: schema/contracts are centralized in `packages/shared` and consumed by both frontends.
- Mixed/fragile: many client utilities (auth API, content API, routing guards, some dashboard helpers) exist as duplicated copies in both `site` and `cms`, which increases drift risk.
- Additional coupling: `apps/site` still contains CMS-oriented components (`apps/site/src/components/cms/*`), suggesting historical co-location before CMS split.

---

## 7. Architecture observations

### What is clear/well separated
1. Workspace-level split is explicit (`site`, `cms`, `api`, `shared`).
2. CMS is now a distinct frontend app with its own entry and shell.
3. Backend route domains are cleanly split between auth and content routers.
4. Public vs CMS API concerns are encoded as `/content/public/*` vs authenticated `/content/*`.

### What is confusing or coupled
1. **Duplication across `apps/site` and `apps/cms`** (auth/content API clients, auth context patterns, guards, repositories).
2. **Legacy artifacts in site app**: CMS component directories remain under `apps/site/src/components/cms/*` though CMS has its own app.
3. **CMS internal structure concentration**: very large `CMSDashboard.tsx` owns many sections + behaviors; sections are only partially extracted.
4. **Routing duality**: public site route resolver supports CMS-like guard logic while CMS has its own separate routing implementation.
5. **Multiple optional paths to same concepts** (e.g., service routes via `#/services/{slug}`, `#service-{slug}`, premium aliases), which increases cognitive load.

### Why the split is hard to understand now
The split is conceptually good at the workspace level, but implementation still carries a lot of **pre-split duplicated logic and leftover files**. So the architecture feels “split physically” but “partially shared by copy,” making ownership boundaries less obvious.

---

## 8. Simple explanation for the owner
- **The site is here:** `apps/site`.
- **The CMS is here:** `apps/cms`.
- **The server is here:** `apps/api`.
- **Shared core types/helpers are here:** `packages/shared`.
- **Public pages are selected in:** `apps/site/src/features/app-shell/AppPageRenderer.tsx` using hash routes.
- **CMS sections are selected in:** `apps/cms/src/cmsRouting.ts` + `apps/cms/src/components/cms/CMSDashboard.tsx`.
- **Both site and CMS read/write content through the same API**, with public endpoints for site and authenticated endpoints for CMS.
