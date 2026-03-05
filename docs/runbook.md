# Runbook incidents

## Incident DB
- Vérifier `/api/health`.
- Contrôler connectivité Mongo (`MONGO_URI`) et quotas.
- Basculer en mode maintenance si latence > SLA.

## Incident media
- Vérifier stockage objet/CDN et permissions upload.
- Purger cache CDN pour variants corrompus.

## Rollback
- Redeployer build N-1.
- Restaurer dump Mongo si migration fautive.

## Restore backup
- `mongorestore --uri "$MONGO_URI" dump/`
- Vérifier index et endpoint health.
