const express = require('express');
const mongoose = require('mongoose');
const { Service } = require('../models/Service');
const { Event } = require('../models/Event');
const { Project } = require('../models/Project');

const router = express.Router();

async function runSearch(req, { onlyPublished = false } = {}) {
  const q = String(req.query.q ?? '').trim();
  const tenantFilter = req.tenant ? { tenantId: req.tenant._id } : {};
  const publishedFilter = onlyPublished ? { status: 'published' } : {};

  const Post = mongoose.model('Post');
  const regex = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  const postQuery = { ...tenantFilter, ...publishedFilter, ...(regex ? { $or: [{ title: regex }, { excerpt: regex }, { content: regex }] } : {}) };
  const serviceQuery = { ...tenantFilter, ...publishedFilter, ...(regex ? { $or: [{ title: regex }, { description: regex }] } : {}) };
  const eventQuery = { ...tenantFilter, ...publishedFilter, ...(regex ? { $or: [{ title: regex }, { description: regex }, { location: regex }] } : {}) };
  const projectQuery = { ...tenantFilter, ...publishedFilter, ...(regex ? { $or: [{ title: regex }, { summary: regex }, { content: regex }] } : {}) };

  const [posts, services, events, projects] = await Promise.all([
    Post.find(postQuery).limit(20).lean(),
    Service.find(serviceQuery).limit(20).lean(),
    Event.find(eventQuery).limit(20).lean(),
    Project.find(projectQuery).limit(20).lean(),
  ]);

  const score = (item) => {
    const title = `${item.title ?? ''}`.toLowerCase();
    if (!q) return 1;
    const term = q.toLowerCase();
    if (title === term) return 100;
    if (title.startsWith(term)) return 60;
    if (title.includes(term)) return 40;
    return 20;
  };

  return [
    ...posts.map((item) => ({ type: 'post', score: score(item), item })),
    ...services.map((item) => ({ type: 'service', score: score(item), item })),
    ...projects.map((item) => ({ type: 'project', score: score(item), item })),
    ...events.map((item) => ({ type: 'event', score: score(item), item })),
  ].sort((a, b) => b.score - a.score);
}

router.get('/', async (req, res) => {
  const items = await runSearch(req, { onlyPublished: false });
  res.json({ data: { items } });
});

router.get('/public', async (req, res) => {
  const items = await runSearch(req, { onlyPublished: true });
  res.json({ data: { items } });
});

module.exports = { searchRoutes: router };
