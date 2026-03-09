const mongoose = require('mongoose');

const PROJECT_STATUSES = ['draft', 'published', 'archived'];

const projectSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 180 },
    slug: { type: String, required: true, trim: true, lowercase: true, minlength: 3, maxlength: 180 },
    summary: { type: String, default: '' },
    content: { type: String, default: '' },
    taxonomies: { type: [String], default: [] },
    status: { type: String, enum: PROJECT_STATUSES, default: 'draft', index: true },
    publishedAt: { type: Date, default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

projectSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

module.exports = { Project, PROJECT_STATUSES };
