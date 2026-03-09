const { Taxonomy } = require('../models/Taxonomy');

function toResponse(item) {
  return { ...item.toObject(), id: String(item._id), _id: String(item._id) };
}

async function listTaxonomies(tenantId) {
  return Taxonomy.find({ tenantId }).sort({ type: 1, label: 1 });
}

async function createTaxonomy({ tenantId, userId, payload }) {
  const exists = await Taxonomy.exists({ tenantId, type: payload.type, slug: payload.slug });
  if (exists) { const err = new Error('Taxonomy slug already exists'); err.status = 409; err.code = 'CONFLICT'; throw err; }
  const item = await Taxonomy.create({ ...payload, tenantId, createdBy: userId, updatedBy: userId });
  return toResponse(item);
}

async function updateTaxonomy({ tenantId, userId, id, payload }) {
  const item = await Taxonomy.findOne({ _id: id, tenantId });
  if (!item) { const err = new Error('Taxonomy not found'); err.status = 404; err.code = 'NOT_FOUND'; throw err; }
  if (payload.slug && payload.slug !== item.slug) {
    const exists = await Taxonomy.exists({ tenantId, type: item.type, slug: payload.slug, _id: { $ne: id } });
    if (exists) { const err = new Error('Taxonomy slug already exists'); err.status = 409; err.code = 'CONFLICT'; throw err; }
  }
  Object.assign(item, payload, { updatedBy: userId });
  await item.save();
  return toResponse(item);
}

async function deleteTaxonomy({ tenantId, id }) {
  const item = await Taxonomy.findOneAndDelete({ _id: id, tenantId });
  if (!item) { const err = new Error('Taxonomy not found'); err.status = 404; err.code = 'NOT_FOUND'; throw err; }
}

module.exports = { listTaxonomies, createTaxonomy, updateTaxonomy, deleteTaxonomy };
