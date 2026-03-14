# Rollback Checklist

1. Stop write-heavy CMS operations (announce content freeze).
2. Capture emergency backups before rollback:
   - `npm run ops:backup`
   - `mongodump --uri "$MONGO_URI" --out server/backups/mongo-pre-rollback-<timestamp>`
3. Roll back application artifact.
4. If content/audit corruption is detected:
   - Restore file data: `npm run ops:restore -- server/backups/backup-<timestamp>`
   - Restore Mongo: `mongorestore --uri "$MONGO_URI" server/backups/mongo-<timestamp>`
5. Run `npm run ops:verify-integrity`.
6. Confirm readiness endpoint and login/CMS critical paths.
