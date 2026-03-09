const express = require('express');
const { requirePermission, Permissions } = require('../security/permissions');
const { Experiment } = require('../models/Experiment');

const router = express.Router();
const tenantFilter = (req) => (req.tenant ? { tenantId: req.tenant._id } : {});

router.get('/', requirePermission(Permissions.EXPERIMENT_READ), async (req, res) => {
  const items = await Experiment.find(tenantFilter(req)).sort({ updatedAt: -1 }).lean();
  res.json({ data: { items } });
});

router.post('/', requirePermission(Permissions.EXPERIMENT_MANAGE), async (req, res) => {
  const item = await Experiment.create({ ...tenantFilter(req), ...req.body });
  res.status(201).json({ data: { item } });
});

router.patch('/:id', requirePermission(Permissions.EXPERIMENT_MANAGE), async (req, res) => {
  const item = await Experiment.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, req.body, { new: true });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ data: { item } });
});

router.post('/:id/start', requirePermission(Permissions.EXPERIMENT_MANAGE), async (req, res) => {
  const item = await Experiment.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { status: 'running' }, { new: true });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ data: { item } });
});

router.post('/:id/stop', requirePermission(Permissions.EXPERIMENT_MANAGE), async (req, res) => {
  const item = await Experiment.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { status: 'stopped' }, { new: true });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ data: { item } });
});

module.exports = { experimentsRoutes: router };
