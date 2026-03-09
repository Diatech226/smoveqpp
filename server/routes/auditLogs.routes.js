const express = require('express');
const { ok } = require('../utils/apiResponse');
const { listAuditLogs } = require('../repositories/audit.repository');

function auditLogsRoutes({ requireAdmin }) {
  const router = express.Router();
  router.use(requireAdmin);

  router.get('/', async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const offset = (page - 1) * limit;
    const [items, total] = await listAuditLogs({ tenantId: req.tenant?._id, entityType: typeof req.query.entityType === 'string' ? req.query.entityType : undefined, action: typeof req.query.action === 'string' ? req.query.action : undefined, limit, offset });
    return ok(res, { items: items.map((entry) => ({ ...entry, id: String(entry._id), _id: undefined })), pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
  });

  return router;
}

module.exports = { auditLogsRoutes };
