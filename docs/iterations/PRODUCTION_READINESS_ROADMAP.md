# CMS/Public Production Readiness Roadmap

## Milestone A — Contract-safe content creation
- Deliver Iteration 01.
- Outcome: any CMS-created Blog/Project item has enough fields to render properly in public UI.

## Milestone B — Deterministic source of truth
- Deliver Iteration 02.
- Outcome: operators know exactly where truth lives; fallback is explicit, not silent.

## Milestone C — Hardened delivery
- Deliver Iteration 03.
- Outcome: validated models, reliable CRUD paths, operational confidence.

## Recommended sequencing
1. Iteration 01 (highest user-visible data mismatch risk).
2. Iteration 02 (highest operational integrity risk).
3. Iteration 03 (systemic quality gate and launch readiness).
4. Iteration 04 (media authority, adapter resilience, and CMS coherence).

## Go-live readiness checklist (high level)
- [ ] CMS create/edit covers all public-required dynamic fields.
- [ ] Published content path is backend authoritative.
- [ ] Media reference integrity checks in place.
- [ ] CRUD-to-render tests pass in CI.
- [ ] Blog/Projects share a stable media reference contract (`media:asset-id`).
- [ ] Media delete guardrails prevent removing referenced assets.
- [ ] Rollback and backup/restore procedures validated.


## Milestone D — Media and content authority convergence
- Deliver Iteration 04.
- Outcome: Blog/Projects/Home content share coherent media references with safer delete and rendering behavior.
