const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true },
    diff: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
module.exports = { AuditLog };
