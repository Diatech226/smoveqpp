# Production Readiness Plan (Current-State Based)

Last updated: 2026-03-15 (iteration: blog-project model harmonization)

## Current status


### Latest iteration progress (P4 operational durability hardening)
### Latest iteration progress (Blog + Projects model harmonization)
- Harmonized Blog/Projects CMS-to-public content contracts around explicit card-safe media fields, with Projects now supporting a first-class `featuredImage` + `imageAlt` contract while preserving legacy `mainImage` compatibility.
- Completed Projects CMS editor coherence: create/edit now captures explicit image alt metadata and persists consistent featured media fields required by public cards/details.
- Added deterministic project card adapter/media resolver so public cards read a stable minimal contract (title/summary/category/client/year/tags/media) with safe fallbacks for legacy records.
- Aligned backend + frontend project normalization/validation so saved records, repository payloads, and public rendering consume the same image/card model.
- Completed CMS media input parity for Projects + Blog: both editors now expose in-form image import fields and media-asset selectors that persist canonical `featuredImage`/`mainImage` references used by public cards/details.
### Latest iteration progress (Projects + Blog CMS workflow completion)
- Completed Projects and Blog admin flows with explicit visible submit actions inside forms (validate/save) and role-aware create entry points in section headers.
- Hardened Blog editor reliability: submit now uses a real form submission path, buttons are typed safely, retries are applied on save, and write attempts are blocked early for unauthorized roles.
- Hardened Projects persistence consistency: project slug uniqueness is now enforced on backend saves (`PROJECT_SLUG_CONFLICT`) and surfaced in CMS validation feedback.
- Improved public-site synchronization for project details by refreshing repository state from the public backend content endpoint before rendering details, while preserving existing design.

### Latest iteration progress (Projects CMS CRUD hardening)
- Stabilized the Projects canonical model with slug/status/featured/timestamps normalization across frontend repository and backend content service.
- Completed Projects CMS workflow reliability: create/edit/delete with stronger validation feedback, slug conflict safety, status controls, and offline-local fallback messaging.
- Completed Projects CMS workflow reliability: visible "Create Project" header action, form submit/save controls, explicit validation/error feedback, and backend-authoritative create/update/delete list refresh.
- Aligned public Projects rendering to CMS-managed source-of-truth by consuming published projects only, with defensive fallbacks for missing summary/tags/gallery data.

- Added schema-versioned content store normalization (`schemaVersion`, `migrationHistory`) so legacy content upgrades are explicit and replayable on read/write.
- Added durable file-backed audit persistence (`server/data/audit-log.json`) and expanded CMS/content action auditing beyond ephemeral in-memory buffers.
- Added backend media upload foundation (`POST /api/v1/content/media/upload`) with size/type validation, deterministic server-side naming, checksum metadata, and local-disk persistence under `server/data/uploads`.
- Added operations scripts (`ops:backup`, `ops:restore`, `ops:verify-integrity`) and runbooks for deployment, rollback, and auth/content recovery.

### Latest iteration progress (P3 release-readiness hardening)
- Added real-browser Playwright critical-flow E2E suite covering register/login/logout, client/admin route behavior, CMS access control, blog publish workflow, and page-content/media paths.
- Hardened session strategy with explicit `SESSION_STORE_MODE`, Mongo-backed production expectation, and fail-fast startup checks when production durability guarantees are not met.
- Added baseline operability endpoints (`/api/v1/health`, `/api/v1/ready`) and structured JSON logs for request correlation, auth events, CMS write failures, and bootstrap mode diagnostics.
- Upgraded release path with explicit production mode fail-fast checks and a committed browser E2E suite scaffold for critical flows (pending CI dependency policy enablement).

### Maturity snapshot
The project is **pre-production** with strong structural progress: modular frontend shell/routing, a working auth API with CSRF/session/RBAC controls, and a functional CMS/blog workflow baseline. It is not yet production-ready due to persistence/session durability gaps, incomplete account lifecycle UX, and limited operational readiness.

### Current strengths
- Frontend route resolution and guards are extracted (`app-routing`) and enforce CMS/auth access flows centrally.
- Auth backend has clear layering (routes → controller → service → repository) and explicit error envelopes.
- Security baseline exists: helmet/CSP, CSRF tokens, cookie session settings, auth rate limiting, RBAC permission checks.
- CMS includes practical sections (overview, projects, blog, media, page content, users, settings) with role-aware behavior.
- CI workflows run lint/typecheck/tests/build plus security scans (gitleaks, semgrep, npm audit).

### Current weaknesses
- Persistent auth is optional and currently fragile in practice: `mongoose`/`connect-mongo` are not listed in dependencies, so deployments can silently run memory-only auth/session fallback.
- Content persistence is mixed (backend file store + frontend localStorage repositories), creating source-of-truth drift risk.
- Password reset APIs exist server-side, but no corresponding frontend reset flow routes/pages are wired.
- Logging/auditability is improved with structured request/auth/CMS failure logs, but durable external telemetry/alerting is still pending.
- Static-analysis gates remain smoke-oriented today; full lint/typecheck enforcement is still a tracked release blocker.

---

## Completed work (confirmed in code)

### Frontend architecture and navigation
- `App.tsx` delegates rendering to `AppPageRenderer` and auth/routing hooks.
- Hash route parsing + guard resolution are centralized in `src/app-routing/*`.
- Security-state pages exist for auth-loading, CMS unavailable, and CMS forbidden.

### Auth and account platform baseline
- Auth context bootstraps server session, handles CSRF tokens, resolves trusted user model, and exposes admin actions.
- Backend auth supports local login/register, OAuth profile login endpoints, email verification, password-reset request/confirm, admin user listing/update, and audit event listing.
- Account page exposes role/status/provider/verification state and verification resend/confirm actions.

### CMS and blog baseline
- CMS dashboard provides sections for blog, projects, media, editable page content, users, settings.
- Blog status lifecycle (`draft`, `in_review`, `published`, `archived`) exists in backend content service with transition rules.
- Public blog rendering consumes canonicalized published entries and derives SEO metadata.

### CI/security foundation
- GitHub Actions quality gate executes lint/typecheck/tests/smoke/build.
- Security workflow includes secret scan, semgrep, security tests, dependency audit.

---

## Partially completed work

### Auth/session durability
- Mongo repository and session-store hooks exist, but runtime durability depends on optional packages not guaranteed by `package.json`.
- Memory fallback is useful for dev, but unsafe as an accidental production mode.

### Role and moderation model
- RBAC permissions and admin user updates are implemented.
- Missing moderation maturity: approval workflows, reason codes, bulk actions, durable audit retention.

### CMS production behavior
- Core CRUD/editor flows exist for content areas.
- Still partial for production-grade UX consistency (uniform retries, empty/error patterns, optimistic conflict handling, stronger validation feedback).

### Email/OAuth operations
- SMTP and OAuth toggles are integrated.
- Production operationalization (provider setup validation, delivery health checks, bounce/failure handling) remains incomplete.

---

## Missing work

1. **Guaranteed persistent auth + session store in production**
   - Enforce Mongo + connect-mongo availability in production builds.
   - Remove ambiguity around memory fallback outside local/dev.

2. **Unified content source-of-truth**
   - Decide authoritative store for blog/media/projects/page content (API-backed) and remove divergent localStorage/file fallbacks for production path.

3. **Complete account lifecycle UX**
   - Implement frontend routes/pages for password reset request/confirm.
   - Add session/device management and stronger self-service security controls.

4. **Observability and operability**
   - Add structured server logs, request correlation, error tracking, metrics, health/readiness endpoints, alerting hooks.

5. **Real quality gates**
   - Replace custom smoke lint/typecheck scripts with full ESLint + TypeScript checks.
   - Add browser E2E coverage for auth/CMS critical paths.

6. **Deployment hardening**
   - Production env validation checklist, secret management posture, backup/restore strategy for Mongo and content assets.

---

## Current technical debt

- **Dual content persistence channels** (frontend localStorage repositories vs backend API/file store).
- **Hash routing only**, limiting SEO/deep-linking flexibility for future public content growth.
- **In-repo build artifacts** (`build/`) increase drift/noise risk.
- **Auth durability ambiguity** due to optional DB/session dependencies.
- **Custom smoke tooling** masquerading as full lint/typecheck.

---

## Production blockers (must resolve before release)

1. Persistent user/session storage not guaranteed by install-time dependencies.
2. No durable observability/alerting stack.
3. Missing frontend password-reset flow despite backend endpoints.
4. Inconsistent authoritative content persistence model.
5. Limited end-to-end regression coverage for critical auth/CMS journeys.

---

## Remaining important iterations (prioritized)

### Iteration P1 — Auth & session hardening (highest priority)
- **Objective:** Make identity/session behavior deterministic and durable in production.
- **Scope:** Dependency hard requirements (`mongoose`, `connect-mongo`), startup checks, production-only fail-fast on memory mode, session rotation/lifetime validation.
- **Main deliverables:**
  - Production bootstrap guard that rejects memory auth/session mode.
  - Confirmed Mongo-backed users + Mongo session store path in CI.
  - Runbook for auth outage/fallback behavior.
- **Risk level:** High.
- **Why it matters:** Without this, auth state can be lost on restart and cannot meet production reliability.

### Iteration P2 — Content persistence unification
- **Objective:** Establish one production source of truth for CMS-managed content.
- **Scope:** API-backed persistence for blog/projects/media/page content; remove production reliance on localStorage/file drift.
- **Main deliverables:**
  - Consistent backend content contracts.
  - Migration path from local seeds/storage to persistent store.
  - Conflict and validation handling at API boundaries.
- **Risk level:** High.
- **Why it matters:** Prevents data divergence and editorial inconsistency.

### Iteration P3 — Content conflict controls & migration hardening
- **Objective:** Remove remaining local fallback ambiguity for CMS-managed content and protect concurrent edits.
- **Scope:** conflict detection/versioning on writes, one-time migration from browser local stores to backend, stronger media reference integrity checks across projects/pages/blog.
- **Main deliverables:**
  - Write precondition/version token support for CMS entities.
  - Safe migration utility and operator runbook for existing local content.
  - Referential integrity checks before media deletion and orphan reporting.
- **Risk level:** High.
- **Why it matters:** Final step to make backend persistence authoritative and recoverable under real production editing load.

### Iteration P4 — Account lifecycle completion
- **Objective:** Complete end-user security lifecycle from frontend to backend.
- **Scope:** Password reset UI flows, verification UX polish, account/session security actions.
- **Main deliverables:**
  - `#reset-password` flow (request + confirm screens) wired to existing APIs.
  - Clear success/error states and token-expiry handling.
  - Basic session revocation/change-password path design.
- **Risk level:** Medium.
- **Why it matters:** Critical for real user support and security hygiene.

### Iteration P5 — Observability and operational readiness
- **Objective:** Make production incidents detectable and diagnosable.
- **Scope:** Structured logs, metrics, health checks, trace/correlation IDs, dashboarding hooks.
- **Main deliverables:**
  - `/health` and `/ready` endpoints.
  - Error monitoring integration and alert thresholds.
  - Audit trail persistence strategy (replace in-memory-only retention).
- **Risk level:** Medium.
- **Why it matters:** Required for stable operations and incident response.

### Iteration P6 — Quality gate modernization
- **Objective:** Increase release confidence with realistic automated checks.
- **Scope:** True lint/typecheck, integration coverage, browser E2E for auth/CMS happy + failure paths.
- **Main deliverables:**
  - ESLint + `tsc --noEmit` in CI.
  - E2E suite covering login/register/verification/CMS access and blog editorial transitions.
  - Test data strategy for deterministic CI runs.
- **Risk level:** Medium.
- **Why it matters:** Prevents regressions in critical workflows.

### Iteration P7 — Deployment/security hardening
- **Objective:** Close final production readiness gaps for secure deployment.
- **Scope:** Secrets handling, infra config baselines, backup/recovery, rate-limit tuning, policy docs.
- **Main deliverables:**
  - Deployment checklist with required env vars and secure defaults.
  - Mongo backup/restore runbook.
  - Security header/cookie/cors validation in staging.
- **Risk level:** Medium.
- **Why it matters:** Enables safe and repeatable production release.

---

## Execution order recommendation
1. P1 Auth/session hardening
2. P2 Content persistence unification
3. P3 Content conflict controls & migration hardening
4. P4 Account lifecycle completion
5. P5 Observability
6. P6 Quality gates
7. P7 Deployment/security hardening

This sequencing minimizes production risk while preserving current product momentum.


## Projects & Services source of truth
- Projects and Services are now managed through the CMS and persisted through the backend content API (`/api/v1/content/projects`, `/api/v1/content/services`).
- Public pages now consume backend public endpoints (`/api/v1/content/public/projects`, `/api/v1/content/public/services`) with repository fallback for resilience.
- CMS bootstraps legacy static/local content into backend storage when backend collections are empty, preventing duplicates via stable IDs/slugs and upsert behavior.

## Final harmonization snapshot — CMS Blog & Projects as source of truth

### Canonical Blog model (CMS → repository → backend → public)
- `id`, `title`, `slug`, `excerpt`, `content`, `featuredImage`, `category`, `tags`, `author`, `publishedDate`, `status` are now treated as the stable rendering baseline.
- CMS Blog editor now captures `tags` and validates `featuredImage` for card integrity.
- Blog normalization adapter (`BlogEntry → BlogCard`) remains the compatibility boundary used by public rendering and SEO hydration.

### Canonical Project model (CMS → repository → backend → public)
- `id`, `title`, `slug`, `summary`, `description`, `featuredImage`, `category`, `tags`, `status`, `link` are now harmonized and persisted.
- CMS Project editor now captures optional `externalLink` and writes both `link` and legacy-compatible `links.live`.
- Project adapter (`ProjectEntry → ProjectCard`) remains authoritative for card-safe fields (slug/title/summary/media alt/query).

### Synchronization guarantees
- Public Blog listing is sourced from backend public content endpoint with local canonical fallback.
- Public Projects listing/detail is sourced from backend public content endpoint with repository normalization fallback.
- Published filtering is enforced in public endpoints and client contract builders.

### Backward compatibility and fallback behavior
- Legacy projects with only `mainImage` continue to render via `featuredImage` normalization.
- Missing summary/excerpt/category fields continue to receive safe canonical fallbacks.
- Missing media still resolves to safe placeholder queries (`blog article image`, `project cover image`) without UI redesign.
