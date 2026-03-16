# CMS vs Public Site Audit (Code-Based)

## Method
Audit performed from the current repository code paths:
- CMS UI/editor: `src/components/cms/CMSDashboard.tsx`
- Public pages: `src/components/BlogPageEnhanced.tsx`, `src/components/ProjectsPage.tsx`, `src/components/ProjectDetailPage.tsx`, `src/components/ServicesHubPage.tsx`, `src/features/marketing/home/HomePageContent.tsx`
- Contract and repositories: `src/domain/contentSchemas.ts`, `src/repositories/*`, `src/features/*Adapter*`
- API + backend service: `src/utils/contentApi.ts`, `src/utils/publicContentApi.ts`, `server/routes/contentRoutes.js`, `server/services/contentService.js`

---

## Executive summary
The CMS is functional but not fully contract-safe for production. The biggest gaps are:
1. **Create forms do not cover all fields used by public rendering** (notably project gallery/testimonial/case study metadata).
2. **Multiple fallback sources** (backend, local storage, static seed data) create source-of-truth ambiguity.
3. **Public rendering still includes static/hardcoded sections** that are not CMS-editable.
4. **Some CMS fields are present but weakly connected to public behavior** (e.g., settings `instantPublishing`, blog social image input visibility).

---

## Domain audit

## 1) Blog

### What currently works
- CMS create/edit validates key publish fields (`title`, `slug`, `excerpt`, `content`, `featuredImage`) before save.
- Backend enforces publishability checks on transition to `published`.
- Public blog page consumes a canonical contract (`getBlogContentContractFromSource`) and uses published posts only.

### What is broken / weak
- Public blog cards and "Lire l'article" interactions are mostly non-navigational UI actions (no detail route consumption from slug).
- Canonical/SEO values are computed but the page canonical always points to `/#/blog`, not per post.

### Missing data (Create vs public/model)
- CMS form does not expose `publishedDate`, `authorRole`, and `images[]` despite model support.
- `socialImage` exists in form state but has no dedicated input field.

### Excessive/unnecessary Create fields
- `tags` are captured in CMS and stored but are not rendered in the public blog listing.

### Source-of-truth notes
- Public fetches backend `/content/public/blog`, but falls back to local repository snapshot if fetch fails.
- Local repository itself is seeded from static defaults when storage is absent.

### Production blockers (blog)
- No complete slug-driven article detail flow to justify full SEO/permalink content model.

---

## 2) Projects

### What currently works
- CMS validates required project card/detail core fields (`title`, `client`, `category`, `summary`, `description`, `challenge`, `solution`, `mainImage`).
- Project slug uniqueness and formatting are enforced across frontend/backend layers.
- Public projects pages read from repository synchronized from backend public endpoint.

### What is broken / weak
- CMS create/edit only supports a **single image input** mapped to `mainImage`/`featuredImage` + a 1-item `images[]` fallback.
- Public detail page supports full `images[]` gallery and testimonial block, but CMS cannot create/edit testimonial nor multi-image gallery.

### Missing data (Create vs public/model)
- Missing CMS fields: `images[]` (multi-gallery), `testimonial.text/author/position`, `links.caseStudy`.
- Missing explicit control for separate card image vs gallery hero image when needed.

### Excessive/unnecessary Create fields
- No major excessive field in current project form; most fields are used.

### Source-of-truth notes
- CMS bootstrapping can push local projects to backend when backend is empty, coupling local fallback state with remote truth.

### Production blockers (projects)
- Model/public renderer richer than CMS create model, leading to incomplete content authoring and inconsistent project detail quality.

---

## 3) Services

### What currently works
- CMS validates required fields and supports status/featured toggles.
- Public services pages consume backend public services and fallback repository data.
- Icon and gradient color are used in public cards.

### What is broken / weak
- No strict icon value validation against allowed icon map in CMS form; invalid icon strings silently fall back in UI.

### Missing data (Create vs public/model)
- No evident missing field for current public rendering.

### Excessive/unnecessary Create fields
- `shortDescription` is stored but not consumed by current public service pages.

### Source-of-truth notes
- Same fallback layering pattern as other domains (remote → local storage/static seed).

### Production blockers (services)
- Low risk area; mostly validation/polish issue.

---

## 4) Page content / editable sections

### What currently works
- CMS has a dedicated home content editor and persistence path to backend `/content/page-content`.
- Public home page consumes `pageContentRepository.getHomePageContent()` for hero/about/service intro copy.

### What is broken / weak
- Large portions of homepage content remain hardcoded in component markup (stats labels/values and several section strings), not editable through CMS.

### Missing data (Create vs public/model)
- Missing CMS controls for additional homepage sections currently hardcoded (portfolio intro copy, stat counters, some CTA labels).

### Excessive/unnecessary Create fields
- None severe in existing home content form.

### Source-of-truth notes
- Home content can fallback to local defaults and local storage even when backend unavailable.

### Production blockers (page content)
- Incomplete CMS control over public page copy prevents true CMS-driven operation.

---

## 5) Media / asset references

### What currently works
- CMS supports upload + media selection and uses media references (`media:<id>`) for blog/project/home about image linking.
- Public rendering resolves media references through adapter helpers.

### What is broken / weak
- Media metadata editing (alt/title/caption post-upload) is absent; only selection and delete available.
- No usage tracking (which content entries reference a media asset) before delete.

### Missing data (Create vs public/model)
- Missing CMS edit form for media metadata critical for accessibility/SEO.

### Production blockers (media)
- Deleting a media asset can silently break references unless manually detected.

---

## 6) Auth/admin access in CMS flows

### What currently works
- Role-based gating is implemented in UI and backend permissions.
- Public endpoints are read-only, admin endpoints require session auth + permissions.

### What is broken / weak
- Some CMS actions degrade to local-only persistence on backend failure; this can hide backend/auth issues and diverge environments.

### Production blockers (auth/reliability)
- Need explicit "remote save failed / local fallback active" operational warning and reconciliation flow.

---

## Priority backlog (ordered)

### P0 (must-fix first)
1. Align project create/edit form with public detail model (gallery + testimonial + case study link).
2. Remove source-of-truth ambiguity for write paths (make backend authoritative, with explicit offline mode instead of silent fallback).
3. Expose/normalize blog fields that affect publication integrity (`publishedDate`, `socialImage` visibility/behavior).

### P1
4. Extend CMS page-content coverage to all currently hardcoded public copy blocks intended to be editorial.
5. Add media metadata edit + reference safety checks.

### P2
6. Tighten validation schemas (icon enums, URL validation, line-length/content constraints).
7. Add stronger E2E/content integrity tests for CRUD-to-render flow.

---

## Production readiness exit criteria
- All public-rendered dynamic fields are editable in CMS (or intentionally static and documented).
- One clear source-of-truth for publishable content in production (backend API).
- No content item can be published in a shape that public pages cannot render safely.
- Media lifecycle includes metadata quality and safe-delete guarantees.
- CI includes contract and flow tests for Blog/Projects/Services/Home content.
