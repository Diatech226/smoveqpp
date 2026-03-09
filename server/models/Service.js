const mongoose = require('mongoose');

const SERVICE_STATUSES = ['draft', 'published'];

const serviceSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
    slug: { type: String, required: true, trim: true, lowercase: true, minlength: 3, maxlength: 180 },
    description: { type: String, trim: true, default: '' },
    status: { type: String, enum: SERVICE_STATUSES, default: 'draft', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

serviceSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
serviceSchema.index({ tenantId: 1, status: 1, updatedAt: -1 });

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

module.exports = { Service, SERVICE_STATUSES };
