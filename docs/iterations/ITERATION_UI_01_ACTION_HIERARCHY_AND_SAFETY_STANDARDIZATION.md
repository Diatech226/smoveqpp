# Iteration UI 01 — Action Hierarchy and Safety Standardization

Date: March 21, 2026  
Scope: CMS UI/UX-only refinement

## Objective
Create one coherent action grammar across CMS sections so operators can immediately identify:
- the primary action,
- the supporting secondary actions,
- and the destructive/risky actions.

## Implemented rules

### 1) Intent taxonomy
- `primary`: save/create dominant controls.
- `secondary`: neutral navigation/support actions.
- `workflow`: status transition actions (review/publish/depublish).
- `danger`: destructive or high-risk actions.

### 2) Placement standards
- Section-level primary create actions remain in header action slots.
- List-row actions are separated into logical clusters:
  - workflow transitions,
  - record management,
  - destructive actions.
- Long-form editors use a sticky footer action bar to keep save action visible.

### 3) Safety framing
- Destructive actions are visually isolated with a danger grouping boundary.
- Risky settings action (“Hydrater backend depuis local”) is separated from save and styled as danger.

## Areas covered
- Overview (header utility action framing)
- Projects
- Blog
- Services
- Media
- Settings
- Page Content

## Behavior preservation
No backend/API/permission/route/CRUD semantics were changed.
Only presentation and interaction clarity were modified.

## Manual validation checklist
1. Open each CMS section and verify one clearly dominant primary action is visible.
2. Confirm publish/review/depublish actions are visually distinct from edit/delete.
3. Confirm delete/danger actions are still available and still require the same existing confirmations.
4. Verify long forms keep all save/cancel capabilities while showing a single sticky dominant save area.
5. Confirm no action became unreachable in Projects, Blog, Services, Media, Settings, and Page Content.
