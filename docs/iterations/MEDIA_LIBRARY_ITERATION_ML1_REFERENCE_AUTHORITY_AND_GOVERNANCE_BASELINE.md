# Media Library Iteration ML-1 — Reference Authority & Governance Baseline

Date: 2026-03-22

## What changed

### 1) Authoritative where-used visibility
- Media detail queries backend reference graph via `GET /api/v1/content/media/:id/references` when a media item is selected.
- UI uses backend response as authoritative for counts, domains, and samples in governance blocks.
- Local index remains a non-blocking fallback hint only when backend references are temporarily unavailable.

### 2) Archive/delete semantics alignment
- Destructive action label changed to **Archiver ce média**.
- Confirmation dialog explicitly states archive semantics (non hard-delete) and operational effect (asset leaves active selectors).
- Error/success copy uses archive language consistently.

### 3) Pre-archive impact visibility
- Before archive, detail panel surfaces:
  - active references total,
  - impacted domains (Blog, Projets, Services, Contenu pages, Réglages),
  - sample affected records/fields,
  - blocked vs allowed archive status.
- Archive attempt is blocked client-side when authoritative references are active, and still protected server-side.

### 4) Governance-oriented detail structure
- Media detail panel is organized into:
  - Inspection asset,
  - Gouvernance • Où utilisé,
  - Complétude métadonnées,
  - Danger zone.

### 5) Baseline metadata completeness indicators
- Added visual indicators for:
  - alt present/missing,
  - caption present/missing,
  - tags present/missing.
- No schema expansion or full metadata scoring introduced in ML-1.

## Public rendering compatibility
- No change made to public media reference contracts (`media:asset-id`) or public rendering behavior.

## What remains for ML-2
- metadata editing workflows,
- restoration/archive browser UX,
- advanced governance workflow enhancements.
