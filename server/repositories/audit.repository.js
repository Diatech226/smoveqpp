const mongoose = require('mongoose');
function getAuditLogModel() { return mongoose.model('AuditLog'); }
function listAuditLogs({ tenantId, entityType, action, limit, offset }) {
  const filters = { tenantId };
  if (entityType) filters.entityType = entityType;
  if (action) filters.action = action;
  return Promise.all([getAuditLogModel().find(filters).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(), getAuditLogModel().countDocuments(filters)]);
}
module.exports = { listAuditLogs };
