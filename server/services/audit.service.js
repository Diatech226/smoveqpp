const { AuditLog } = require('../models/AuditLog');

async function logAudit(req, action, entityType, entityId, diff = undefined) {
  await AuditLog.create({
    tenantId: req.tenant?._id,
    actorId: req.user?._id,
    action,
    entityType,
    entityId,
    diff,
    ip: req.ip,
    userAgent: req.get('user-agent') ?? '',
  });
}

module.exports = { logAudit };
