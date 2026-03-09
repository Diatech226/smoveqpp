const express = require('express');
const { requirePermission, Permissions } = require('../security/permissions');
const { Plugin } = require('../models/Plugin');
const { getPluginCatalog } = require('../plugins/loaders/pluginLoader');

const router = express.Router();
const tenantFilter = (req) => (req.tenant ? { tenantId: req.tenant._id } : {});

router.get('/', requirePermission(Permissions.PLUGIN_READ), async (req, res) => {
  const persisted = await Plugin.find(tenantFilter(req)).lean();
  const catalog = getPluginCatalog();
  const items = catalog.map((manifest) => persisted.find((item) => item.key === manifest.key) ?? { ...manifest, status: 'inactive' });
  res.json({ data: { items } });
});

router.post('/:key/activate', requirePermission(Permissions.PLUGIN_MANAGE), async (req, res) => {
  const manifest = getPluginCatalog().find((plugin) => plugin.key === req.params.key);
  if (!manifest) return res.status(404).json({ error: 'Plugin not found' });
  const item = await Plugin.findOneAndUpdate({ ...tenantFilter(req), key: manifest.key }, { ...manifest, status: 'active' }, { upsert: true, new: true });
  res.json({ data: { item } });
});

router.post('/:key/deactivate', requirePermission(Permissions.PLUGIN_MANAGE), async (req, res) => {
  const item = await Plugin.findOneAndUpdate({ ...tenantFilter(req), key: req.params.key }, { status: 'inactive' }, { new: true });
  if (!item) return res.status(404).json({ error: 'Plugin not found' });
  res.json({ data: { item } });
});

module.exports = { pluginsRoutes: router };
