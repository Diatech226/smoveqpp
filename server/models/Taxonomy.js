const mongoose = require('mongoose');

const TAXONOMY_TYPES = ['service_sector', 'service_category', 'project_sector', 'project_category', 'post_category'];

const taxonomySchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    type: { type: String, enum: TAXONOMY_TYPES, required: true, index: true },
    label: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

taxonomySchema.index({ tenantId: 1, type: 1, slug: 1 }, { unique: true });
const Taxonomy = mongoose.models.Taxonomy || mongoose.model('Taxonomy', taxonomySchema);
module.exports = { Taxonomy, TAXONOMY_TYPES };
