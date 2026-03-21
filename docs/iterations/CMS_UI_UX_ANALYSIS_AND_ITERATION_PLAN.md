# CMS UI/UX Analysis and Iteration Plan

## Iteration status

- Iteration 1 — **Action Hierarchy & Safety Standardization**: ✅ Implemented (March 21, 2026)
- Iteration 2 — Pending
- Iteration 3 — Pending

## Iteration 1 scope implemented

This iteration standardizes CMS action intent and placement without changing backend behavior, contracts, routing, permissions, or CRUD semantics.

### Canonical action hierarchy

1. **Primary actions**
   - Use the same primary button treatment across CMS (`AdminButton` with `intent="primary"`).
   - Section-level create actions remain in section headers and are consistently dominant.
   - Long forms now end with one sticky primary save area (`AdminStickyFormActions`) to reduce competing save bars.

2. **Secondary actions**
   - Non-destructive controls use a shared secondary style (`AdminButton` default intent).
   - Cancel/reset/retry/refresh now present consistently.

3. **Workflow actions**
   - Publish/review/depublish transitions use the dedicated workflow intent (`intent="workflow"`) to distinguish state transitions from record edits.

4. **Destructive actions**
   - Delete/hydrate-risk actions use a dedicated danger intent (`intent="danger"`).
   - Destructive controls are grouped in explicit danger clusters with visual separation (`AdminActionCluster danger`).

## Standardization applied

- Shared action primitives added for intent taxonomy and grouping.
- Projects, Services, Blog list-row actions grouped into workflow / management / destructive clusters.
- Page Content and long-form editors now use sticky, consistent save/cancel bars.
- Settings risky controls (hydrate) are visually framed as destructive and separated from save.
- Header-level utility action (“Voir le site”) aligned with secondary action framing.

## What remains for next UI/UX iteration

- Improve field-level information architecture inside long forms (grouping of inputs).
- Harmonize supporting helper text hierarchy and spacing rhythm.
- Refine empty/success/error state consistency beyond actions.
