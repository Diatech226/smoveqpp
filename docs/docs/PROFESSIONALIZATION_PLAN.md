# Production Readiness Plan (Current-State Based)

Last updated: 2026-03-14

## Current status

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
- Logging/auditability is mostly console/in-memory, without durable telemetry/alerting.
- "Lint" and "typecheck" scripts are smoke checks, not full static analysis/type compilation gates.

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

### Iteration P3 — Account lifecycle completion
- **Objective:** Complete end-user security lifecycle from frontend to backend.
- **Scope:** Password reset UI flows, verification UX polish, account/session security actions.
- **Main deliverables:**
  - `#reset-password` flow (request + confirm screens) wired to existing APIs.
  - Clear success/error states and token-expiry handling.
  - Basic session revocation/change-password path design.
- **Risk level:** Medium.
- **Why it matters:** Critical for real user support and security hygiene.

### Iteration P4 — Observability and operational readiness
- **Objective:** Make production incidents detectable and diagnosable.
- **Scope:** Structured logs, metrics, health checks, trace/correlation IDs, dashboarding hooks.
- **Main deliverables:**
  - `/health` and `/ready` endpoints.
  - Error monitoring integration and alert thresholds.
  - Audit trail persistence strategy (replace in-memory-only retention).
- **Risk level:** Medium.
- **Why it matters:** Required for stable operations and incident response.

### Iteration P5 — Quality gate modernization
- **Objective:** Increase release confidence with realistic automated checks.
- **Scope:** True lint/typecheck, integration coverage, browser E2E for auth/CMS happy + failure paths.
- **Main deliverables:**
  - ESLint + `tsc --noEmit` in CI.
  - E2E suite covering login/register/verification/CMS access and blog editorial transitions.
  - Test data strategy for deterministic CI runs.
- **Risk level:** Medium.
- **Why it matters:** Prevents regressions in critical workflows.

### Iteration P6 — Deployment/security hardening
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
3. P3 Account lifecycle completion
4. P4 Observability
5. P5 Quality gates
6. P6 Deployment/security hardening

This sequencing minimizes production risk while preserving current product momentum.
