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
