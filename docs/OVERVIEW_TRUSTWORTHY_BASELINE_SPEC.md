# Overview — Trustworthy Baseline (Iteration 1)

## 1) Updated information architecture (Overview only)

1. **System trust state (top priority)**
   - Runtime mode banner (`authoritative_remote` vs `degraded_local`)
   - Sync diagnostics warning
2. **Release risk & readiness (authoritative)**
   - Content health diagnostics
   - Launch readiness baseline
   - Top actionable issues
3. **Volume context (secondary)**
   - Total projects
   - Total blog posts
   - Total media files
4. **Workflow shortcuts (non-authoritative actions)**
   - New project
   - New blog post
   - Upload media
5. **Activity feed state**
   - Explicit unavailable state until backend source is connected

## 2) KPI authority matrix

| KPI / Block | Source | Authority level | Freshness notes |
|-------------|--------|-----------------|-----------------|
| Runtime mode | Runtime API calls (fallback behavior) | High | Real-time per request failure path |
| Sync diagnostics warning | `/sync-diagnostics` backend endpoint | High | Pulled on dashboard load |
| Content health diagnostics | `/content/health` backend endpoint | High | Pulled on dashboard load (no exposed timestamp) |
| Launch readiness summary/top issues | `/content/health` backend endpoint | High | Pulled on dashboard load (no exposed timestamp) |
| Total projects | CMS repository state loaded in dashboard runtime | Medium | Current session snapshot |
| Total blog posts | CMS repository state loaded in dashboard runtime | Medium | Current session snapshot |
| Total media files | CMS repository state loaded in dashboard runtime | Medium | Current session snapshot |
| Recent activity timeline | Not connected yet | None | Explicitly marked unavailable |

## 3) Static indicator deprecation list

Removed from Overview:

1. Static KPI: **`Vues Totales`** (`12.5k`).
2. Static trend labels: **`+12%`, `+8%`, `+15%`, `+23%`**.
3. Hard-coded “Activité récente” items and relative timestamps.

Replacement policy:

- Use only authoritative sources for high-visibility indicators.
- If source is unavailable, render explicit unavailable copy instead of placeholder values.
- Add “Source + freshness” microcopy in each key block.
