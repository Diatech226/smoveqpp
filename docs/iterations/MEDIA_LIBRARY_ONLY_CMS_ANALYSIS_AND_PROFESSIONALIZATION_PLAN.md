# Media Library (CMS only) — Analysis and professionalization plan

> Note: Public-site render-contract hardening work is tracked separately in
> `docs/iterations/MEDIA_ITERATION_01_RENDER_CONTRACT_HARDENING.md`.

## Iteration tracking

### ML-1 — Reference authority & governance baseline (implemented 2026-03-22)

Scope delivered in this iteration:
- Media detail now loads authoritative `where-used` references from backend `/media/:id/references` and uses this as source-of-truth for governance decisions.
- Archive semantics are explicit in UI labels and confirmation wording (`Archiver ce média`), aligned with backend archive-first behavior.
- Pre-archive impact visibility is shown before action (active reference count, impacted domains, sample fields/pages, blocked/allowed state).
- Media detail is structured into operational blocks: Inspection asset, Governance/Where used, Metadata completeness, and Danger zone.
- Baseline metadata completeness indicators are visible for alt/caption/tags.

Out of scope for ML-1 (deferred to ML-2+):
- full metadata editor and scoring,
- replace flows redesign,
- archive browser/restore UX,
- broader DAM platform changes.
