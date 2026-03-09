const { createValidator, normalizeSlug } = require('./common');
const { TAXONOMY_TYPES } = require('../models/Taxonomy');

const validateCreateTaxonomy = createValidator((payload, errors) => {
  const value = {};
  if (!TAXONOMY_TYPES.includes(payload.type)) errors.push('invalid taxonomy type');
  else value.type = payload.type;
  if (typeof payload.label !== 'string' || payload.label.trim().length < 2) errors.push('label is required');
  else value.label = payload.label.trim();
  value.slug = normalizeSlug(payload.slug || payload.label, 120);
  if (!value.slug) errors.push('slug is invalid');
  value.active = payload.active === undefined ? true : Boolean(payload.active);
  return value;
});

const validateUpdateTaxonomy = createValidator((payload, errors) => {
  const value = {};
  if (payload.label !== undefined) {
    if (typeof payload.label !== 'string' || payload.label.trim().length < 2) errors.push('label is required');
    else value.label = payload.label.trim();
  }
  if (payload.slug !== undefined) {
    value.slug = normalizeSlug(payload.slug, 120);
    if (!value.slug) errors.push('slug is invalid');
  }
  if (payload.active !== undefined) value.active = Boolean(payload.active);
  return value;
});

module.exports = { validateCreateTaxonomy, validateUpdateTaxonomy };
