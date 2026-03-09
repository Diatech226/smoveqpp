const express = require('express');
const mongoose = require('mongoose');
const { Service } = require('../models/Service');
const { Event } = require('../models/Event');
const { Taxonomy } = require('../models/Taxonomy');
const { CmsSettings } = require('../models/CmsSettings');
const { Project } = require('../models/Project');

const { AudienceSegment, ContentVariant, PersonalizationRule } = require('../models/Personalization');

const router = express.Router();

function publishedFilter(query = {}) {
  return { ...query, status: 'published' };
}

function paginate(req) {
  const page = Math.max(Number.parseInt(String(req.query.page ?? '1'), 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '20'), 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function tenantFilter(req) {
  return req.tenant ? { tenantId: req.tenant._id } : {};
}

async function listPublished(req, res, Model, sort = { publishedAt: -1, updatedAt: -1 }) {
  const { page, limit, skip } = paginate(req);
  const query = publishedFilter(tenantFilter(req));
  if (typeof req.query.slug === 'string') query.slug = req.query.slug;
  const [items, total] = await Promise.all([
    Model.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Model.countDocuments(query),
  ]);
  res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=60');
  return res.json({ data: { items, page, limit, total, totalPages: Math.ceil(total / limit) } });
}

router.get('/posts', async (req, res) => {
  const Post = mongoose.model('Post');
  return listPublished(req, res, Post);
});

router.get('/posts/:slug', async (req, res) => {
  const Post = mongoose.model('Post');
  const item = await Post.findOne(publishedFilter({ ...tenantFilter(req), slug: req.params.slug })).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=60');
  return res.json({ data: { item } });
});

router.get('/services', async (req, res) => listPublished(req, res, Service));
router.get('/projects', async (req, res) => listPublished(req, res, Project));
router.get('/events', async (req, res) => listPublished(req, res, Event, { startsAt: 1 }));

router.get('/taxonomies', async (req, res) => {
  const query = { ...tenantFilter(req), active: true };
  if (typeof req.query.type === 'string') query.type = req.query.type;
  const items = await Taxonomy.find(query).sort({ type: 1, label: 1 }).lean();
  return res.json({ data: { items } });
});


router.get('/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const regex = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  const scope = tenantFilter(req);
  const filters = regex ? { $or: [{ title: regex }, { description: regex }, { summary: regex }, { excerpt: regex }] } : {};
  const Post = mongoose.model('Post');
  const [posts, services, projects, events] = await Promise.all([
    Post.find({ ...scope, status: 'published', ...filters }).limit(10).lean(),
    Service.find({ ...scope, status: 'published', ...filters }).limit(10).lean(),
    Project.find({ ...scope, status: 'published', ...filters }).limit(10).lean(),
    Event.find({ ...scope, status: 'published', ...filters }).limit(10).lean(),
  ]);
  return res.json({ data: { items: [...posts.map((item) => ({ type: 'post', item })), ...services.map((item) => ({ type: 'service', item })), ...projects.map((item) => ({ type: 'project', item })), ...events.map((item) => ({ type: 'event', item }))] } });
});

router.get('/brand', async (req, res) => {
  const item = await CmsSettings.findOne(tenantFilter(req)).lean();
  return res.json({ data: { item: item ?? null } });
});


router.post('/resolve-content', async (req, res) => {
  const { contentType, contentId, segmentKey } = req.body ?? {};
  const scope = tenantFilter(req);
  const segment = await AudienceSegment.findOne({ ...scope, key: segmentKey, isActive: true }).lean();
  if (!segment) return res.json({ data: { resolution: 'default', variant: null } });
  const rule = await PersonalizationRule.findOne({ ...scope, contentType, contentId, segmentId: segment._id, isActive: true }).sort({ priority: 1 }).lean();
  if (!rule) return res.json({ data: { resolution: 'default', variant: null } });
  const variant = await ContentVariant.findOne({ ...scope, _id: rule.variantId }).lean();
  return res.json({ data: { resolution: variant ? 'variant' : 'default', variant } });
});

module.exports = { publicRoutes: router };
