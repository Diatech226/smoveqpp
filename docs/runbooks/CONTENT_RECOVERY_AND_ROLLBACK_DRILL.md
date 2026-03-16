# Content Recovery + Rollback Drill (Production)

## Purpose
Operational playbook to recover from bad CMS publishes, broken media references, or rollback mistakes while minimizing public impact.

## Preconditions
- Latest backup archive exists (`npm run ops:backup`).
- Operators can run restore/integrity scripts on deployment host.
- CMS write operations can be temporarily frozen.

## Drill 1 — Bad content published
1. Freeze editorial writes (announce temporary CMS content freeze).
2. Identify impacted content IDs/slugs from CMS + logs (`cms_*_failed`, `cms_blog_*`).
3. Revert impacted entries in CMS (preferred) or from backup restore if broad corruption.
4. Run integrity checks:
   - `npm run ops:verify-integrity`
5. Validate public routes manually:
   - Homepage
   - Blog list/detail
   - Project list/detail
6. Resume writes after sign-off.

## Drill 2 — Media deletion/ref mismatch
1. Attempted delete returns `MEDIA_IN_USE` when references still exist.
2. In CMS, remove or replace all `media:<id>` references from:
   - Blog featured/social/gallery
   - Project featured/gallery
   - Home about image
3. Retry deletion only after reference cleanup.
4. If asset was deleted externally from disk, restore `server/data/uploads` from backup, then run `npm run ops:verify-integrity`.

## Drill 3 — Full content rollback
1. Freeze CMS writes.
2. Take emergency snapshot before rollback:
   - `npm run ops:backup`
3. Restore known-good content backup:
   - `npm run ops:restore -- server/backups/backup-<timestamp>`
4. Restart backend service.
5. Verify integrity and critical auth/content paths:
   - `npm run ops:verify-integrity`
   - `curl -f http://<host>/api/v1/ready`
6. Execute manual smoke on CMS + public pages.
7. Unfreeze writes and log incident timeline.

## Roll-forward fallback
If rollback fails validation:
1. Re-restore the emergency snapshot created in step 2.
2. Bring service to known-running state.
3. Escalate incident and keep CMS writes frozen until root cause is addressed.
