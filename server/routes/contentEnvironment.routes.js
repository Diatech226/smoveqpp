const express = require('express');
const { requirePermission, Permissions } = require('../security/permissions');
const { ContentEnvironmentState, ENVIRONMENTS } = require('../models/ContentEnvironmentState');

const router = express.Router();

router.get('/:type/:id/environment-status', requirePermission(Permissions.CONTENT_ENVIRONMENT_READ), async (req, res) => {
  const query = { contentType: req.params.type, contentId: req.params.id, ...(req.tenant ? { tenantId: req.tenant._id } : {}) };
  let item = await ContentEnvironmentState.findOne(query).lean();
  if (!item) {
    item = await ContentEnvironmentState.create({ ...query, environments: { draft: true, staging: false, production: false } });
  }
  return res.json({ data: { item } });
});

router.post('/:type/:id/promote', requirePermission(Permissions.CONTENT_ENVIRONMENT_PROMOTE), async (req, res) => {
  const from = req.body?.from;
  const to = req.body?.to;
  if (!ENVIRONMENTS.includes(from) || !ENVIRONMENTS.includes(to)) {
    return res.status(400).json({ error: 'Invalid environment transition' });
  }
  const query = { contentType: req.params.type, contentId: req.params.id, ...(req.tenant ? { tenantId: req.tenant._id } : {}) };
  const item = await ContentEnvironmentState.findOneAndUpdate(
    query,
    { $set: { [`environments.${to}`]: true, lastPromotedBy: req.user?._id ?? null, lastPromotionAt: new Date() }, $setOnInsert: { [`environments.${from}`]: true } },
    { new: true, upsert: true },
  );
  return res.json({ data: { item, promoted: { from, to } } });
});

module.exports = { contentEnvironmentRoutes: router };
