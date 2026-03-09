const { ok } = require('../utils/apiResponse');
const service = require('../services/media.service');
const { logAudit } = require('../services/audit.service');

async function getMedia(req, res) {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const items = await service.listMedia(req.tenant?._id, q);
  return ok(res, { items });
}

async function postMedia(req, res) {
  const item = await service.createMedia({ tenantId: req.tenant?._id, userId: req.user._id, payload: req.validatedBody });
  await logAudit(req, 'media.upload', 'media', item.id, { mimeType: item.mimeType, size: item.size });
  return res.status(201).json({ success: true, data: { item }, error: null, meta: {} });
}

async function removeMedia(req, res) {
  await service.deleteMedia({ tenantId: req.tenant?._id, id: req.params.id });
  await logAudit(req, 'media.delete', 'media', req.params.id);
  return res.status(204).end();
}

module.exports = { getMedia, postMedia, removeMedia };
