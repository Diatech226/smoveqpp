const express = require('express');
const { requirePermission, Permissions } = require('../security/permissions');
const { AudienceSegment, ContentVariant, PersonalizationRule } = require('../models/Personalization');

const router = express.Router();

const tenantFilter = (req) => (req.tenant ? { tenantId: req.tenant._id } : {});

router.get('/segments', requirePermission(Permissions.PERSONALIZATION_READ), async (req, res) => {
  const items = await AudienceSegment.find(tenantFilter(req)).sort({ priority: 1, createdAt: -1 }).lean();
  res.json({ data: { items } });
});

router.post('/segments', requirePermission(Permissions.PERSONALIZATION_MANAGE), async (req, res) => {
  const item = await AudienceSegment.create({ ...tenantFilter(req), ...req.body });
  res.status(201).json({ data: { item } });
});

router.get('/variants', requirePermission(Permissions.PERSONALIZATION_READ), async (req, res) => {
  const items = await ContentVariant.find(tenantFilter(req)).sort({ updatedAt: -1 }).lean();
  res.json({ data: { items } });
});

router.post('/variants', requirePermission(Permissions.PERSONALIZATION_MANAGE), async (req, res) => {
  const item = await ContentVariant.create({ ...tenantFilter(req), ...req.body });
  res.status(201).json({ data: { item } });
});

router.post('/rules', requirePermission(Permissions.PERSONALIZATION_MANAGE), async (req, res) => {
  const item = await PersonalizationRule.create({ ...tenantFilter(req), ...req.body });
  res.status(201).json({ data: { item } });
});

router.post('/public/resolve-content', async (req, res) => {
  const { contentType, contentId, segmentKey } = req.body ?? {};
  const segment = await AudienceSegment.findOne({ ...tenantFilter(req), key: segmentKey, isActive: true }).lean();
  if (!segment) return res.json({ data: { resolution: 'default', variant: null } });

  const rule = await PersonalizationRule.findOne({ ...tenantFilter(req), contentType, contentId, segmentId: segment._id, isActive: true }).sort({ priority: 1 }).lean();
  if (!rule) return res.json({ data: { resolution: 'default', variant: null } });

  const variant = await ContentVariant.findOne({ ...tenantFilter(req), _id: rule.variantId }).lean();
  return res.json({ data: { resolution: variant ? 'variant' : 'default', variant } });
});

module.exports = { personalizationRoutes: router };
