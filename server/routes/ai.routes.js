const express = require('express');
const { requirePermission, Permissions } = require('../security/permissions');

const router = express.Router();

function mockAiResult(type, input) {
  const base = String(input?.text ?? input?.title ?? '').trim();
  if (type === 'summarize') return { summary: base.slice(0, 160) };
  if (type === 'rewrite') return { suggestions: [`${base} (version éditoriale optimisée)`] };
  if (type === 'seo-suggestions') return { metaTitle: (input?.title ?? 'Untitled').slice(0, 55), metaDescription: (input?.text ?? '').slice(0, 150), slug: String(input?.title ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') };
  if (type === 'taxonomy-suggestions') return { tags: base.split(' ').filter(Boolean).slice(0, 5).map((token) => token.toLowerCase()) };
  return {};
}

for (const endpoint of ['summarize', 'rewrite', 'seo-suggestions', 'taxonomy-suggestions']) {
  router.post(`/${endpoint}`, requirePermission(Permissions.AI_ASSIST), async (req, res) => {
    return res.json({ data: { provider: 'mock', endpoint, result: mockAiResult(endpoint, req.body), requiresHumanValidation: true, generatedAt: new Date().toISOString() } });
  });
}

module.exports = { aiRoutes: router };
