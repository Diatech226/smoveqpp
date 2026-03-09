const { ok } = require('../utils/apiResponse');
const service = require('../services/settings.service');
const { logAudit } = require('../services/audit.service');

async function getSettings(req, res) {
  const item = await service.getSettings(req.tenant?._id, req.user._id);
  return ok(res, { item });
}

async function patchSettings(req, res) {
  const item = await service.patchSettings({ tenantId: req.tenant?._id, userId: req.user._id, payload: req.validatedBody });
  await logAudit(req, 'settings.update', 'settings', String(item._id), req.validatedBody);
  return ok(res, { item });
}

module.exports = { getSettings, patchSettings };
