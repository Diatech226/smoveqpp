# CMS Global Analysis and Professionalization Plan

## 1. Executive summary

### CMS maturity level
The CMS is at an **intermediate maturity level**: it already includes editorial CRUD, workflow statuses, media references, settings governance, and diagnostics. However, it is not yet a full professional communication platform because several contracts remain partially aligned, and some important public rendering behaviors are still hardcoded outside CMS control.

### Alignment level with public site
Overall CMS ↔ public alignment is **partial and uneven by section**:
- **Strong alignment**: Projects core fields, Blog core fields, Homepage textual sections, site title/logo/support email.
- **Partial alignment**: Media roles are present but not consistently surfaced as explicit roles in all UIs.
- **Weak alignment**: Dashboard KPIs (partly static), social/SEO propagation on public pages, and metadata governance in Media library.

### Biggest global problems
- **Data mismatch**
  - Several schema fields are not represented in CMS forms (ex: some SEO/media role fields for projects/services/blog).
  - Some CMS-editable fields are not rendered by the public UI (ex: project external/case-study links).
- **UI mismatch**
  - Dashboard displays static values that can diverge from real content state.
  - Public pages still contain hardcoded labels/blocks not governed by CMS.
- **Editorial limitations**
  - Incomplete SEO publishing chain (field exists in CMS but not fully injected into public meta tags on all templates).
  - Tags/taxonomy are editable but inconsistently visible to end users.
- **Missing media governance**
  - Asset roles are implicit; no enforceable role system per template (card/hero/social/gallery).
  - Media metadata quality controls are weak (limited alt/title lifecycle editing).

### Biggest opportunities
- Turn CMS into a full communication tool by introducing strict, explicit content contracts per public component.
- Improve brand consistency with enforced brand settings usage (logos, favicon, social image, contact identity).
- Improve storytelling quality by structuring content for cards vs details vs social snippets.

---

## 2. Section-by-section analysis

### SECTION: Vue d’ensemble (Dashboard)

#### 1. Current role
Provide operational overview: quick stats, shortcuts, recent activity, readiness diagnostics.

#### 2. What the public site renders
- Public rendering is not directly driven by dashboard content.
- Dashboard should mirror real production state for projects/blog/media/settings readiness.

#### 3. CMS data vs public rendering

| Element | Used on site | Editable in CMS | Issue |
|--------|-------------|----------------|------|
| KPI cards (Projects/Articles/Médias/Vues) | No direct public rendering | No (hardcoded values) | Static numbers can mislead editorial decisions |
| “Activité récente” list | No direct public rendering | No (hardcoded) | Not connected to real content events |
| Content health diagnostics | Indirectly (quality of public content) | Computed server-side, not manually editable | Useful but mixed with static dashboard blocks |
| Quick actions | Indirect | N/A | Good UX, but should be paired with real KPIs |

#### 4. Problems detected
- Static KPI values and static recent activity reduce trust in dashboard.
- Decision support is fragmented: high-value diagnostics exist, but coexist with non-authoritative indicators.
- Missing editorial funnel KPIs (draft aging, review SLA, publish velocity, unresolved blockers trend).

#### 5. Media analysis
- Dashboard reports unresolved media refs and missing alt, but does not provide direct drill-down to remediation queues.

#### 6. UX/editorial issues
- Mixed signal quality (hardcoded vs authoritative) creates ambiguity.
- For a professional platform, dashboards should be decisional and auditable.

#### 7. Required corrections
- Replace static KPI cards with computed metrics from backend analytics.
- Replace static activity feed with real audit/content events.
- Add actionable panels: “to review”, “blocked by media”, “SEO incomplete”, “stale drafts”.

#### 8. Professional iteration proposal

### Iteration 1 — Decision-grade Dashboard
- **Objective**: make overview reliable for editorial and release decisions.
- **Scope**: dashboard KPI cards + activity + action queues.
- **Improvements**: authoritative metrics only; trend indicators; role-aware widgets.
- **Data changes**: expose KPI endpoints (velocity, backlog, SLA, failure rates).
- **Media changes**: queue of unresolved assets with direct deep-links.
- **UX improvements**: “what to do next” section by role.
- **Risk level**: Low/Medium.
- **Validation criteria**: all dashboard figures traceable to backend payloads; zero static fake KPI blocks.

---

### SECTION: Projets

#### 1. Current role
Manage project catalog, card/detail content, publication status, media, and testimonial.

#### 2. What the public site renders
- **Cards** (homepage + projects page): title, summary, category, year, client, tags, card image.
- **Detail page**: title, description, challenge, solution, results, testimonial, hero image, gallery images.
- **Routing**: slug-based detail navigation.

#### 3. CMS data vs public rendering

| Element | Used on site | Editable in CMS | Issue |
|--------|-------------|----------------|------|
| title, slug, client, category, year | Yes | Yes | Aligned |
| summary (card) | Yes | Yes | Aligned |
| description/challenge/solution/results | Yes | Yes | Aligned |
| tags | Yes | Yes | Aligned |
| cardImage + heroImage + galleryImages | Yes | Yes | Aligned but role semantics not explicit to editors |
| testimonial (text/author/position) | Yes (if complete) | Yes | Aligned |
| externalLink / caseStudyLink | Not rendered in public project templates | Yes | CMS fields currently non-effective in UI |
| project SEO fields (title/description/canonical/social) | Potentially expected for professional comms | No dedicated project SEO form | Contract gap |
| social image role | Not clearly enforced in project public meta | Partially (schema-level only) | Missing rendering contract |

#### 4. Problems detected
- CTA link fields exist but are not surfaced in project detail UI.
- No explicit SEO editing experience for projects despite schema support.
- Media role governance is technically present, but editorial semantics remain implicit.

#### 5. Media analysis
- Required roles for professional output:
  - card image
  - hero image
  - gallery images
  - social sharing image
- Current gaps:
  - social role not operationalized in UI and meta output,
  - no per-role validation presets (ratio/size/focal guidance).

#### 6. UX/editorial issues
- Editors can fill fields that users never see (external/case-study links in current templates).
- Missing “where this field appears” hints for each input.

#### 7. Required corrections
- Either render `externalLink/caseStudyLink` in detail page CTA blocks or deprecate these fields.
- Add project SEO group in CMS (title/description/canonical/social image/noindex optional).
- Enforce explicit media roles with role-based validation and previews.

#### 8. Professional iteration proposal

### Iteration 2 — Project Storytelling Contract Upgrade
- **Objective**: align project editing with actual storytelling blocks in cards/details/social.
- **Scope**: project form + project detail template + meta generation.
- **Improvements**: explicit CTA block, SEO block, media-role block.
- **Data changes**: normalize links and SEO fields under stable contract.
- **Media changes**: per-role constraints (card 16:9, hero 1:1/16:9 policy, gallery set, social 1200x630).
- **UX improvements**: field-to-rendering preview map.
- **Risk level**: Medium.
- **Validation criteria**: every project field maps to a live rendering target or is removed.

---

### SECTION: Blog

#### 1. Current role
Manage editorial pipeline for blog posts, taxonomy, publication state, and SEO primitives.

#### 2. What the public site renders
- **Blog listing**: featured + cards with title/excerpt/author/date/category/image.
- **Blog detail**: title/date/readTime/category/featured image/excerpt/content.
- **Metadata**: title and partial description/canonical behavior; not fully consistent across templates.

#### 3. CMS data vs public rendering

| Element | Used on site | Editable in CMS | Issue |
|--------|-------------|----------------|------|
| title, slug, excerpt, content, author | Yes | Yes | Aligned |
| category | Yes | Yes | Aligned |
| tags | Mostly not rendered in key public templates | Yes | Editorial effort with limited public impact |
| featuredImage | Yes | Yes | Aligned |
| readTime, publishedDate | Yes | Yes | Aligned |
| seoTitle, seoDescription, canonicalSlug | Partially used | Yes | Incomplete propagation to all public metas |
| socialImage | Weakly used in public pages | Yes | Not reliably injected per article template |
| authorRole | Not rendered | No in form | Schema/UI drift |
| images[] / extra media roles | Mostly not surfaced | No direct structured UI | Legacy/contract drift |

#### 4. Problems detected
- SEO chain is incomplete: CMS captures fields but frontend templates do not consistently publish canonical/description/social per article.
- Tags governance exists but user-facing use is limited.
- Potential duplication between legacy image fields and mediaRoles.

#### 5. Media analysis
- Needed roles:
  - card/featured image
  - social image
  - optional inline body images
- Current issue: social image is editorially editable but not fully operationalized in public metadata.

#### 6. UX/editorial issues
- Editors can set SEO/social values without guaranteed outcome.
- Taxonomy guidance exists, but category/tag rendering strategy is not complete on public pages.

#### 7. Required corrections
- Enforce a single canonical media contract for blog cards/detail/social.
- Add deterministic meta injection on blog detail (title, description, canonical, og:image, twitter:image, robots).
- Define clear policy for tags: either render/filter/tag pages or simplify tag input.

#### 8. Professional iteration proposal

### Iteration 3 — Blog SEO & Taxonomy Professionalization
- **Objective**: make blog a real acquisition and authority channel.
- **Scope**: CMS blog form, metadata renderer, taxonomy UX.
- **Improvements**: complete SEO output per page; consistent canonical/social handling.
- **Data changes**: deprecate redundant legacy fields; keep one canonical shape.
- **Media changes**: explicit social image fallback hierarchy.
- **UX improvements**: SEO preview snippet + validation warnings.
- **Risk level**: Medium.
- **Validation criteria**: every published blog article has deterministic, inspectable SEO/social meta output.

---

### SECTION: Médiathèque

#### 1. Current role
Store and reference media assets for blog/projects/home/settings.

#### 2. What the public site renders
- Images are rendered across navigation/footer, homepage, blog, project cards and details.
- Assets are resolved from URL or `media:asset-id` references.

#### 3. CMS data vs public rendering

| Element | Used on site | Editable in CMS | Issue |
|--------|-------------|----------------|------|
| Media list/search/select | Yes (indirect) | Yes | Basic alignment |
| Upload file | Yes | Yes | Upload currently minimal metadata input |
| alt/title/caption/tags metadata | Yes (alt/title in many places) | Very limited post-upload editing | Governance gap |
| Usage references (who uses asset) | Indirectly useful | Partially visible | Good start but not full impact analysis |
| Delete safety | Indirectly critical | Yes (with usage hint) | No full replace workflow for referenced assets |

#### 4. Problems detected
- Metadata lifecycle is weak (no robust edit workflow after upload).
- No role-based presets by destination (hero/card/social/logo/favicon/gallery).
- Replace/delete workflows need stronger safeguards for production governance.

#### 5. Media analysis
- Required role taxonomy:
  - `brand.logo`, `brand.logoDark`, `brand.favicon`, `brand.socialDefault`
  - `project.card`, `project.hero`, `project.gallery`, `project.social`
  - `blog.featured`, `blog.social`, `page.about`
- Missing today: first-class role assignment and validation presets.

#### 6. UX/editorial issues
- Editors must infer whether an asset fits a use case.
- Weak metadata editing lowers accessibility and SEO consistency.

#### 7. Required corrections
- Add editable metadata form (alt/title/caption/tags/credit/license).
- Add role presets and recommended dimensions.
- Add “replace asset” flow preserving references.

#### 8. Professional iteration proposal

### Iteration 4 — Media Role System & Asset Governance
- **Objective**: professionalize media management as shared platform capability.
- **Scope**: media library model, validation, lifecycle actions.
- **Improvements**: role tagging, metadata quality gates, safe replace/delete.
- **Data changes**: add `roles[]`, `usageCount`, `lastUsedAt`, optional rights metadata.
- **Media changes**: enforce role presets and responsive renditions policy.
- **UX improvements**: usage graph + bulk metadata actions.
- **Risk level**: Medium/High (cross-cutting).
- **Validation criteria**: no publish-ready content with unresolved critical media role requirements.

---

### SECTION: Contenu par page

#### 1. Current role
Centralized editing for homepage textual/CTA sections.

#### 2. What the public site renders
- Hero block text + CTAs.
- Services intro text.
- About block text + image + CTA.
- Portfolio block headings + CTA.
- Blog block headings + CTA.
- Contact section title/subtitle/button label.

#### 3. CMS data vs public rendering

| Element | Used on site | Editable in CMS | Issue |
|--------|-------------|----------------|------|
| Hero fields | Yes | Yes | Good alignment |
| Services intro fields | Yes | Yes | Good alignment |
| About text/image/CTA | Yes | Yes | Good alignment |
| Portfolio section texts/CTA | Yes | Yes | Good alignment |
| Blog section texts/CTA | Yes | Yes | Good alignment |
| Contact title/subtitle/submit label | Yes | Yes | Good alignment |
| Section-level hardcoded labels/stats (e.g. fixed badges/stats in some areas) | Yes | No | Brand/story consistency gap |
| Multi-page content governance (beyond homepage) | Partial | No dedicated structure | “Contenu par page” scope too narrow versus label |

#### 4. Problems detected
- Section name suggests broad “page content”, but current model mainly covers homepage.
- Some visual/textual elements remain hardcoded in templates (limiting editorial authority).
- No modular blocks/repeaters for richer storytelling (proof points, trust logos, testimonials on homepage).

#### 5. Media analysis
- About image is editable.
- Missing structured media slots for additional homepage storytelling modules.

#### 6. UX/editorial issues
- Good baseline form, but lacks preview mapping and advanced structured blocks.
- Risk of duplication if future pages add independent ad-hoc content configs.

#### 7. Required corrections
- Rename scope in UI or extend model to true multi-page content.
- Extract remaining hardcoded communication copy into CMS contracts.
- Introduce reusable content block system (headline, body, CTA, media, KPI row).

#### 8. Professional iteration proposal

### Iteration 5 — Page Content Platformization
- **Objective**: evolve from homepage-form to reusable page-content system.
- **Scope**: schema, CMS UI, renderer adapters.
- **Improvements**: structured reusable blocks and section templates.
- **Data changes**: add typed block arrays per page route.
- **Media changes**: per-block image role requirements.
- **UX improvements**: live preview + block reorder + reusable snippets.
- **Risk level**: Medium.
- **Validation criteria**: no hardcoded strategic copy in top-level marketing pages without CMS override.

---

### SECTION: Utilisateurs

#### 1. Current role
Manage user accounts, roles, account status, verification status, and identity audit trail.

#### 2. What the public site renders
- Public site itself does not render user-management data, but role/permission model governs CMS operations and publish rights.

#### 3. CMS data vs public rendering

| Element | Used on site | Editable in CMS | Issue |
|--------|-------------|----------------|------|
| role/accountStatus/emailVerified | Indirectly (authorization behavior) | Yes (admin context) | Useful but mainly operational |
| Auth provider / verification metadata | Indirectly | Read-only in UI | Acceptable |
| Audit log | Indirectly | Read-only | Good for traceability |
| Workflow assignment/moderation queues | Needed for editorial platform | No | Missing professional workflow controls |
| Non-admin user management UX | N/A | Partially coded but mostly unreachable due CMS access policy | UX/contract inconsistency |

#### 4. Problems detected
- Current CMS access policy is admin-only; broader editorial governance relies on backend roles but lacks dedicated collaborative workflow tooling.
- Missing moderation mechanics: ownership, reviewer assignment, comment/review cycle history in UI.

#### 5. Media analysis
- N/A (direct media role not central here), but user accountability should include media operations audit.

#### 6. UX/editorial issues
- Operational user edits exist, but editorial workflow management is minimal.
- Professional teams need explicit states, assignees, and handoff visibility.

#### 7. Required corrections
- Add editorial workflow board concepts: owner, reviewer, due date, blocked reason.
- Expose permission matrix by role in settings/help panel.
- Clarify UI according to effective access policies.

#### 8. Professional iteration proposal

### Iteration 6 — Editorial Workflow & Permissions UX
- **Objective**: transform user section from account admin to collaboration control center.
- **Scope**: users panel + content assignment surfaces.
- **Improvements**: assignment, review handoff, moderation logs.
- **Data changes**: add assignment metadata on blog/project entities.
- **Media changes**: track asset ownership/reviewer for critical brand assets.
- **UX improvements**: role-aware queues and notifications.
- **Risk level**: Medium.
- **Validation criteria**: measurable reduction in unpublished/blocked items without owner.

---

### SECTION: Paramètres

#### 1. Current role
Global governance for brand settings, operational publishing guardrails, and taxonomy policy.

#### 2. What the public site renders
- Site title, support email, logo, favicon, default social image are used in navigation/footer/document head.
- Global publishing rules affect CMS publish actions.

#### 3. CMS data vs public rendering

| Element | Used on site | Editable in CMS | Issue |
|--------|-------------|----------------|------|
| siteTitle | Yes | Yes | Aligned |
| supportEmail | Yes | Yes | Aligned |
| brandMedia.logo | Yes | Yes | Aligned |
| brandMedia.favicon | Yes | Yes | Aligned |
| brandMedia.defaultSocialImage | Partially (global fallback) | Yes | Good but page-level override strategy incomplete |
| brandMedia.logoDark | Not clearly used in public UI | Yes | Potential unused field |
| taxonomy managed categories/tags | Yes (editorial constraints) | Yes | Aligned, but frontend tag usage remains partial |
| instantPublishing | Yes (workflow guardrail) | Yes | Aligned |

#### 4. Problems detected
- `logoDark` appears editable without clear frontend consumption.
- Social image governance is global-first but lacks complete per-entity fallback orchestration.
- Settings describe authority model well, but enforcement consistency across all public pages needs completion.

#### 5. Media analysis
- Brand media roles are defined but need explicit usage map and validation (dimensions, file type, max size).

#### 6. UX/editorial issues
- Good governance direction, but missing “where used” visual map for each setting.
- Settings rollback is strong; impact preview could further reduce mistakes.

#### 7. Required corrections
- Confirm/implement `logoDark` usage or deprecate.
- Add settings usage map and validation hints per field.
- Formalize social image fallback hierarchy: entity social > entity featured > global default.

#### 8. Professional iteration proposal

### Iteration 7 — Brand Governance Hardening
- **Objective**: make settings the reliable brand-control plane.
- **Scope**: site settings + public head/meta consumers.
- **Improvements**: strict field usage contracts, fallback hierarchy, visibility matrix.
- **Data changes**: optional `brandMediaUsage` metadata map.
- **Media changes**: preset validation for logo/favicon/social assets.
- **UX improvements**: “impact preview” before save.
- **Risk level**: Low/Medium.
- **Validation criteria**: every settings field has an explicit consumer or is removed.

---

## Cross-section problems

1. **Data contract drift**
   - Legacy vs canonical fields coexist (especially media-related fields), increasing ambiguity.
2. **Media inconsistency**
   - Role semantics exist in code but are not uniformly explicit in CMS UX.
3. **SEO gaps**
   - SEO/social fields are unevenly propagated to final public metadata per template.
4. **Duplication risk**
   - Hardcoded public copy + CMS copy coexist in some sections.
5. **Missing governance loops**
   - Diagnostics exist, but remediation workflows are not fully integrated.
6. **Storytelling structure limitations**
   - Page content model is mostly homepage-specific and not yet block-based for scalable narrative design.

---

## 3–5 HIGH-VALUE ITERATIONS

### Iteration A — Content Contract Alignment
- **Objective**: ensure one-to-one mapping between CMS fields and rendered UI components.
- **Scope**: Projects, Blog, Page Content, Settings contracts.
- **Expected impact**: eliminate dead fields and missing fields; reduce editorial confusion.
- **Risk**: Medium.
- **Priority**: P0.

### Iteration B — Media Role System
- **Objective**: standardize and enforce image/video roles across platform.
- **Scope**: media schema, project/blog/page settings integrations, validators.
- **Expected impact**: stronger visual consistency, accessibility, and publish confidence.
- **Risk**: Medium/High.
- **Priority**: P0.

### Iteration C — Editorial Workflow Upgrade
- **Objective**: professionalize collaboration with assignment/review governance.
- **Scope**: Users + content entities + dashboard queues.
- **Expected impact**: faster throughput, fewer blocked publications.
- **Risk**: Medium.
- **Priority**: P1.

### Iteration D — Storytelling & SEO Expansion
- **Objective**: turn CMS into a communication growth engine.
- **Scope**: Blog SEO chain, project storytelling CTAs, modular page content blocks.
- **Expected impact**: better brand narrative and discoverability.
- **Risk**: Medium.
- **Priority**: P1.

### Iteration E — CMS as Digital Communication Platform
- **Objective**: unify observability, governance, and content operations.
- **Scope**: dashboard orchestration, health-to-action links, release readiness gates.
- **Expected impact**: strategic control and predictable publishing quality.
- **Risk**: Medium.
- **Priority**: P2.

---

## Media harmonization matrix

| Section | Required images | Optional images | Issues |
|--------|-----------------|----------------|-------|
| Dashboard | None (diagnostic only) | None | Lacks direct remediation links for media issues |
| Projets | card, hero, gallery, (social recommended) | testimonial portrait (future) | social role not fully operationalized; link fields not rendered |
| Blog | featured/card, social, optional inline body media | author avatar (future) | social metadata chain incomplete on public pages |
| Médiathèque | role-based governance assets | rights/credit docs | no strong role presets; weak metadata lifecycle |
| Contenu par page | about image, optional section visuals | decorative background assets | limited structured slots beyond existing homepage fields |
| Utilisateurs | N/A | profile avatars (future) | no editorial ownership linkage for media lifecycle |
| Paramètres | logo, favicon, default social image | logoDark | logoDark usage unclear; validation presets missing |

---

## Key critical issues
- Dashboard still contains non-authoritative static KPI/activity blocks.
- Project and blog contracts include fields with incomplete rendering consumption.
- Media governance is not yet role-first and lifecycle-safe.
- SEO/social output is not consistently propagated from CMS to final page metadata.

## Highest-impact quick fixes
- Replace static dashboard cards/activity with backend-authoritative metrics/events.
- Either render or deprecate project external/case-study links.
- Add/complete per-template metadata rendering (canonical/description/social image).
- Add post-upload media metadata editing and role hints.

## Strategic transformation opportunities
- Introduce strict content contracts with field-to-component traceability.
- Build reusable content blocks for cross-page storytelling.
- Establish role-based operational dashboards and editorial assignment workflows.
- Convert media library into a governed asset platform with validation presets.

## Recommended next implementation order
1. **Iteration A — Content Contract Alignment**
2. **Iteration B — Media Role System**
3. **Iteration D — Storytelling & SEO Expansion**
4. **Iteration C — Editorial Workflow Upgrade**
5. **Iteration E — CMS as Digital Communication Platform**

CMS global analysis and professionalization plan ready.
