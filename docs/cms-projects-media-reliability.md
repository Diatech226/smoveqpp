# CMS Projects & Media reliability notes

## Source of truth for Projects count/list

- In the CMS dashboard, project metrics now derive directly from the in-memory `projects` state used to render the Projects section list.
- This avoids stale count/list drift when repository storage and rendered state diverge during asynchronous refresh.

## Media library refresh contract

- Media synchronization from backend now uses `replaceAll` instead of additive `save` loops.
- This ensures archived/deleted assets are removed from active local state and prevents stale/broken card/detail entries.
- After upload and archive actions, the media list is re-fetched and fully synchronized before rendering.

## Media URL preview contract

- Media URLs that are path-like relative values (e.g. `uploads/media/file.jpg`) are now resolved against API origin for CMS rendering.
- Human labels or non-URL placeholders are intentionally not rewritten.
