# Professionalization Plan (Execution Update — CMS + Blog)

## What changed in this revision
- Re-based the plan on the current repository state (routing extraction, auth hardening, repositories, CI workflows).
- Split status into **completed / partially completed / missing** to remove ambiguity.
- Re-prioritized work around **stabilization and professionalization**, not redesign.
- Added a dedicated, execution-ready next iteration for **CMS harmonization** and **blog architecture hardening**.

---

## Current status
The app has moved from “single-file prototype” toward a structured baseline:
- Front routing and guards are now extracted into `app-routing` + app-shell renderer modules.
- Auth has stronger foundations (structured API envelope, CSRF flow, rate limiting, role checks, session handling, tests).
- Repository abstractions now exist for blog/media/projects with runtime payload validation and localStorage safety fallbacks.
- CI workflows for quality and security are present.

Current maturity is **prototype+ / pre-production**: architecture is significantly improved, but key business-critical layers are still incomplete for production-grade operation (persistent auth data, robust CMS flows, blog-to-CMS content pipeline, observability depth, and real e2e coverage).

---

## Completed work
- **Frontend architecture (major step completed)**
  - `App.tsx` was reduced to orchestration; page rendering moved to app-shell modules.
  - Hash navigation/route guards extracted to `src/app-routing/*` with tests.
- **Auth/API normalization (completed at baseline level)**
  - Standardized API envelope and error code handling in frontend auth API utilities.
  - Backend auth controller/service/repository split introduced.
  - CSRF token handling integrated in auth flows.
- **Security baseline improvements (completed baseline)**
  - Helmet + CSP + secure session cookie policy + CSRF middleware + auth rate limiter are in place.
  - Production fail-fast check for weak/default session secret exists.
- **Data layer scaffolding (completed foundation)**
  - Repository layer exists (`blogRepository`, `mediaRepository`, `projectRepository`, `cmsRepository`).
  - Runtime validation and storage fallback handling implemented.
- **Quality pipeline (completed baseline)**
  - Quality and security GitHub workflows added.
  - Verify script chain (`lint`, `typecheck`, tests, build) exists.

---

## Partially completed work
- **CMS professionalization**
  - Dashboard shell, sidebar, and high-level sections exist.
  - However, most CMS sections are still scaffolded/placeholder-level and not fully workflow-complete.
- **Auth hardening**
  - Logic is cleaner and safer than before, but persistence is still in-memory; no durable user/session store.
- **Repository adoption**
  - Repositories exist, but adoption is uneven: not all user-facing content flows rely on the same data source.
- **Testing strategy**
  - Unit/integration coverage improved in targeted areas.
  - “Smoke e2e” exists but remains script-level and does not validate real browser end-to-end paths.

---

## Missing work
- **Production-grade auth/data backend still missing**
  - No persistent user database integration in active runtime path.
  - No externalized session store for scale/restart resilience.
- **CMS functional depth still missing**
  - Inconsistent loading/empty/error states across admin workflows.
  - Limited CRUD completion across projects/blog/media/settings sections.
  - Incomplete role/permission UX clarity and admin feedback loops.
- **Blog content architecture gap**
  - Current blog page experience is visually strong, but content sourcing remains disconnected from a stable CMS publishing pipeline.
  - No complete lifecycle for draft → review → publish → render consistency.
- **Observability/operability gap**
  - No full production error telemetry/tracing strategy.
  - Health/readiness conventions and runbook-level operational posture are still incomplete.
- **DX consistency gap**
  - Lint/typecheck scripts are still partial smoke implementations rather than full static analysis enforcement.

---

## Current technical debt
- Dual/legacy component variants remain (e.g., older/newer blog/page implementations), creating maintenance overhead.
- Build artifacts are tracked in-repo, increasing noise and risk of drift.
- Hash-based routing remains a pragmatic choice but carries long-term deep-link/SEO/composability constraints.
- Documentation consistency is improved but still not fully unified across all files and examples.
- CMS and blog data responsibilities are not yet fully aligned under one authoritative content contract.

---

## Updated priorities
1. **Complete CMS workflow reliability and UI harmonization (no redesign).**
2. **Stabilize blog architecture + content pipeline while preserving existing blog UI.**
3. **Finish auth/runtime durability (persistent user store + production session strategy).**
4. **Upgrade quality gates (real lint/typecheck + true browser e2e critical flows).**
5. **Add operational readiness (telemetry, health/readiness, failure playbooks).**

---

## Next iteration — CMS and Blog

### Scope
This iteration is intentionally constrained:
- **CMS:** incremental UI harmonization + workflow completion.
- **Blog:** architecture/reliability/SEO-content readiness only.
- **No blog visual redesign.**
- **No big-bang rewrite.**

### CMS professionalization (incremental harmonization)

#### Objectives
- Make CMS screens feel like one coherent product.
- Standardize admin interaction patterns without changing visual identity direction.
- Increase content operation reliability.

#### Work packages
1. **Shared admin layout/pattern kit (inside existing style language)**
   - Reusable page header, action bar, panel/card, table wrapper, form section primitives.
   - Unified spacing, typography scale usage, and interaction states across all CMS sections.
2. **State model consistency**
   - Standard loading/empty/error/success components and copy rules for all CMS pages.
   - Consistent inline and toast feedback for create/update/delete flows.
3. **CRUD workflow completion**
   - Projects/blog/media/settings sections aligned on list → edit/create → validate → save → confirm flows.
   - Confirm dialogs and destructive action safeguards standardized.
4. **Role/permission UX clarity**
   - Explicit permission messaging at page/section/action level.
   - Prevent “silent no-op” interactions for forbidden actions.
5. **CMS data reliability**
   - Add optimistic update rollback or explicit refresh strategy.
   - Strengthen repository error mapping to user-facing admin states.

#### Deliverables
- CMS sections share the same admin interaction conventions.
- No section ships without explicit loading/empty/error behaviors.
- CMS UX feels unified and professionally consistent, without visual redesign.

### Blog professionalization (preserve existing UI)

#### Objectives
- Keep current blog visual identity intact.
- Improve content architecture, robustness, and future CMS compatibility.

#### Work packages
1. **Single source of truth for blog content**
   - Route blog rendering through one canonical content access layer (repository/service contract).
   - Remove divergence between static view models and managed content models.
2. **Publishing robustness**
   - Enforce schema validity and slug uniqueness at save time.
   - Define deterministic publish ordering and fallback behavior for missing/invalid fields.
3. **Rendering reliability**
   - Defensive rendering paths for malformed content/media references.
   - Stable handling for empty blog states and partial content.
4. **SEO-readiness (non-visual)**
   - Ensure canonical metadata pipeline readiness (title/description/slug/canonical source contract).
   - Prepare structured content fields required for future SEO automation.
5. **CMS compatibility bridge**
   - Define a clear handoff contract between CMS-managed blog entries and frontend blog rendering.
   - Keep API/repository interfaces versionable for future backend migration.

#### Deliverables
- Blog UI unchanged, but backed by a more reliable and maintainable content pipeline.
- CMS blog content can be consumed consistently by frontend rendering paths.

### Suggested sequence (2–3 weeks)
- **Week 1:** CMS shared patterns + state consistency primitives.
- **Week 2:** CMS section workflow completion + permissions clarity.
- **Week 3:** Blog data-flow unification + SEO/readiness contracts + stabilization tests.

---

## Risks / watchpoints
- Risk of accidental visual drift in CMS while harmonizing components.
- Risk of content regressions if blog data unification is attempted without migration guards.
- Risk of false confidence from script-level smoke checks without browser-level e2e.
- Risk of auth/session regressions when introducing persistence if contracts are not versioned.

---

## Execution principles
- **No unnecessary redesign.**
- **Preserve successful existing UX.**
- **Incremental changes over big-bang refactors.**
- **Stabilize before expanding scope.**
- **Keep backward compatibility when it reduces delivery risk.**
- **Separate architecture work from visual redesign decisions.**
- **Prioritize maintainability, reliability, and operational clarity.**
- **For the blog: preserve current visual identity and avoid UI redesign proposals.**
- **For the CMS: harmonize incrementally within current visual language.**

---

## Iteration 1 execution update (implemented)

### CMS (structural consistency + workflow reliability)
- Added shared admin primitives for page header, action bar, panel wrapper, and standardized loading/empty/error/success states.
- Applied these patterns across key CMS sections (projects, blog, media, settings) within the existing dashboard shell.
- Standardized action feedback patterns for save/create/destructive actions with explicit confirmation safeguards.
- Added consistent section-level loading behavior when switching admin areas.

### Blog (content/data reliability, no visual redesign)
- Introduced a blog content service contract (`getBlogContentContract`) as a canonical source for blog listing data consumed by the UI.
- Migrated the blog page to use repository-backed content instead of hardcoded page-local post arrays.
- Added safe mapping/fallback behavior for missing excerpt/author/category/image/date/read-time fields.
- Added slug-based contract resolver restricted to published content to support future CMS publishing bridge.

### CMS ↔ Blog compatibility foundation
- Defined a stable blog list contract (`BlogListItem`) to bridge CMS-managed blog entries and frontend rendering needs.
- Added tests to validate contract stability and draft/published compatibility behavior.

### Deferred to Iteration 2
- Full CMS CRUD completion with persisted create/edit forms per section.
- Stronger permission matrices and per-action authorization UX.
- End-to-end publish lifecycle orchestration (draft/review/publish workflow across CMS and frontend routes).
- Extended content validation (slug uniqueness enforcement at save-time repository level).

## Iteration 2 execution update (implemented)

### CMS workflow completion and consistency
- Completed the **blog admin workflow loop** in CMS (`list → create/edit → validate → save → confirm → delete confirmation`) with clear save/pending/error feedback.
- Added explicit role-based admin action clarity for destructive operations (delete restricted to admin role with visible messaging instead of silent no-op behavior).
- Improved settings section from scaffolded toggle to validated save flow with persisted admin configuration (`siteTitle`, `supportEmail`, `instantPublishing`).
- Standardized section feedback behavior by routing repository and validation errors into explicit admin error states.

### Blog pipeline hardening and CMS compatibility
- Added a canonical blog entry adapter layer to normalize CMS-authored payloads and frontend-rendered entries under a stable contract.
- Enforced slug normalization and slug uniqueness checks at repository save-time to prevent route/content collisions.
- Strengthened blog content contract with deterministic ordering (`publishedDate` then slug tie-break) and explicit SEO-ready metadata fields (`title`, `description`, `canonicalSlug`) without any visual change to blog pages.
- Hardened CMS-to-blog mapping via `fromCmsBlogInput` so CMS forms produce schema-valid, render-safe blog entities.

### Deferred to Iteration 3
- Project CRUD persistence and media upload authoring flow completion in CMS.
- Full backend publishing orchestration and review workflow across roles.
- Browser e2e coverage for critical admin publish/edit/delete paths.

## Iteration 3 execution update (implemented)

### CMS content operations maturity
- Completed **projects CMS workflow loop** with operational parity to blog (`list → create/edit → validate → save → confirm → delete confirmation`) using the same admin state and action semantics.
- Upgraded project repository from static-read model to storage-backed CRUD contract to remove placeholder behavior in core content operations.
- Added explicit retry actions for blog/settings failures to prevent dead-end admin states and make recovery behavior visible.
- Preserved existing CMS visual language while improving section-level consistency of editing panels, validation errors, save states, and destructive action safeguards.

### Blog publishing/rendering stability
- Tightened canonical published content filtering in blog content service through an explicit `renderable + published` predicate before list/detail rendering.
- Centralized slug-detail resolution on canonical entries to reduce divergence between listing and detail contracts.
- Kept blog visual output unchanged while making publish/read assumptions explicit in the data layer.

## Iteration 5 execution update (implemented)

### Media reliability and normalization
- Introduced a canonical media reference pattern for blog featured assets (`media:<id>`) with safe resolution and fallback behavior.
- Hardened repository validation to reject dangling media references at save-time instead of publishing broken asset links.
- Normalized media persistence (`alt`, `caption`, tags) to improve consistency between CMS pickers and blog consumption.

### SEO metadata readiness without visual redesign
- Extended canonical blog contracts with deterministic SEO metadata (`title`, `description`, `canonicalSlug`, `socialImage`) and migration-safe defaults.
- Added CMS blog editing support for SEO-safe fields (SEO title/description/canonical slug) inside the existing form language.
- Added non-visual blog metadata hydration (`document.title`, description meta, canonical link) driven by published content contract.

### CMS productivity and trust hardening
- Added explicit invalid-media feedback in CMS save flows to make asset integrity failures visible and recoverable.
- Added unsaved-change guardrails in blog editor mode to reduce accidental content loss during repeated edit operations.
- Kept CMS interaction model incremental and visually aligned while improving save/publish confidence signals.

### Deferred to Iteration 6
- Full media upload lifecycle UX (upload, replace, deprecate) with stronger asset governance.
- Expanded SEO governance (length checks, duplication checks, advanced social cards) across all content types.
- Browser e2e coverage for CMS media-linked publish flows and metadata integrity checks.

### CMS ↔ Blog publishing bridge
- Reinforced the bridge around canonical adapters by ensuring frontend contracts are derived only from publishable canonical entries.
- Kept backward-safe behavior for existing seeded and CMS-authored entries while clarifying the contract for future persistent publishing orchestration.

### Deferred to Iteration 4
- Media upload authoring UX inside CMS (file picker + upload progress + validation constraints).
- Role-aware archive/unpublish lifecycle beyond hard delete.
- Browser e2e coverage for CMS project/blog critical paths (create/edit/delete/retry).
- Dedicated metadata editing workflow (canonical title/description overrides) in CMS blog editor.

## Iteration 4 execution update (implemented)

### CMS editorial lifecycle maturity
- Expanded blog editorial status model to `draft | published | archived` with explicit CMS visibility and action paths.
- Added clear status transition actions in CMS blog list (`publish`, `unpublish to draft`, `archive`) with confirmation prompts for each transition.
- Improved admin trust signals with lifecycle summary cards (draft/published/archived counts), clearer status labels, and transition failure messaging.
- Strengthened save vs publish separation by supporting explicit “save as draft” and “publish” actions directly from the blog editor form.

### CMS persistence reliability
- Hardened blog repository with explicit lifecycle operations (`publish`, `unpublish`, `archive`) and typed operational errors (`not found`, `invalid status transition`, `slug conflict`).
- Added safe legacy migration behavior for persisted blog entries missing `status`, defaulting to `draft` during read normalization.
- Preserved backward compatibility by normalizing persisted payloads instead of requiring a destructive data reset.

### CMS ↔ Blog publication contract hardening
- Introduced explicit publishability evaluation in the blog entry adapter layer to codify which fields/states make an entry public-safe.
- Wired blog content service to that publishability contract so public listing/detail flows deterministically exclude draft/archived/incomplete content.
- Kept blog presentation unchanged while making publication eligibility a formal, test-backed domain rule.

### Deferred to Iteration 5
- Role-specific review-ready workflow and editorial approvals (author → editor → publisher).
- Scheduled publishing/unpublishing windows and richer publication audit history.
- Backend-backed durable publishing pipeline beyond local storage persistence.

## Iteration 6 execution update (implemented)

### Persistent backend-backed CMS path
- Added server-side content repository/service/routes for blog operations under `/api/v1/content` (and compatibility path `/api/content`) with file-backed persistence (`server/data/content.json`) to survive browser sessions and local storage resets.
- Introduced explicit backend operations for blog list/save/delete/status transition and a stable service-level error mapping (`BLOG_VALIDATION_ERROR`, `BLOG_SLUG_CONFLICT`, `BLOG_NOT_FOUND`, `BLOG_INVALID_STATUS_TRANSITION`, `BLOG_NOT_PUBLISHABLE`).
- Wired CMS blog loading/saving/deleting/status transitions to backend APIs with local repository fallback when backend is temporarily unavailable, preserving current repository interfaces while introducing a production-credible durable path.

### Editorial roles, permissions, and moderation hardening
- Expanded editorial status model to include `in_review` alongside `draft`, `published`, and `archived`.
- Enforced role-aware publish controls in backend routes (authors can write and submit for review, but cannot publish directly).
- Formalized moderation transitions (`draft → in_review`, `in_review → published`, `published ↔ draft`, archive flows) with invalid transition blocking server-side.
- Updated CMS UI action affordances and messaging to make role constraints explicit (disabled states + visible notices instead of silent no-op behavior).

### CMS ↔ blog publication trust + analytics foundation
- Added publishability validation on backend publish path so malformed/incomplete content cannot be promoted to public status.
- Preserved existing frontend blog visual rendering while tightening backend state transitions that govern public eligibility.
- Added foundational editorial analytics endpoint and CMS indicators for draft/in-review/published/archived/recently-updated visibility.

### Deferred to Iteration 7
- Migrate projects/media metadata CRUD to the same backend content service and remove remaining local-storage-first write paths.
- Add audit metadata (reviewer, timestamps, transition actor) and review comments for collaborative moderation.
- Add browser e2e coverage for author/editor/admin review + publish permissions matrix.

## Iteration 6 execution update (implemented)

### Post-auth product coherence by role
- Implemented deterministic post-login routing by role so admin/staff users land in CMS while non-admin authenticated users land in a dedicated non-admin destination (`#account`) instead of being funneled into CMS-only flows.
- Added explicit intent preservation for CMS access attempts: unauthenticated users requesting `#cms-*` are redirected to login and, after auth, routed according to permission (admin to dashboard, client to clear forbidden state).
- Prevented authenticated users from re-entering login/register dead-ends by redirecting those routes to their role-aware destination.

### Session/user-shape hardening for access decisions
- Hardened frontend session user normalization to enforce trusted role/status/account/auth-provider defaults before permission checks.
- Kept backend role/status/account separation intact (`role` for authorization, status/account fields for lifecycle) and aligned frontend guard behavior to role-based access decisions.

### Foundation for future client authenticated area
- Added a lightweight `Mon compte` authenticated page as a coherent non-admin destination without introducing a large customer portal.
- Extended global navigation with role-aware account/dashboard actions while keeping blog UI and public site visual identity unchanged.

### Deferred to Iteration 7
- Expand `Mon compte` with client-relevant profile/preferences/history modules backed by persistent APIs.
- Add browser e2e tests for full role-based auth journeys (public → login/register → role destination, CMS-intent preservation).
