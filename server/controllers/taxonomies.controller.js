const { ok } = require('../utils/apiResponse');
const service = require('../services/taxonomies.service');
const { logAudit } = require('../services/audit.service');

async function getTaxonomies(req, res) { return ok(res, { items: await service.listTaxonomies(req.tenant?._id) }); }
async function postTaxonomy(req, res) {
  const item = await service.createTaxonomy({ tenantId: req.tenant?._id, userId: req.user._id, payload: req.validatedBody });
  await logAudit(req, 'taxonomy.create', 'taxonomy', item.id, { type: item.type });
  return res.status(201).json({ success: true, data: { item }, error: null, meta: {} });
}
async function patchTaxonomy(req, res) {
  const item = await service.updateTaxonomy({ tenantId: req.tenant?._id, userId: req.user._id, id: req.params.id, payload: req.validatedBody });
  await logAudit(req, 'taxonomy.update', 'taxonomy', item.id, req.validatedBody);
  return ok(res, { item });
}
async function removeTaxonomy(req, res) {
  await service.deleteTaxonomy({ tenantId: req.tenant?._id, id: req.params.id });
  await logAudit(req, 'taxonomy.delete', 'taxonomy', req.params.id);
  return res.status(204).end();
}
module.exports = { getTaxonomies, postTaxonomy, patchTaxonomy, removeTaxonomy };
