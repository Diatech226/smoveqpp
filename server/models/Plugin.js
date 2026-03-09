const mongoose = require('mongoose');

const pluginSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    version: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'inactive', index: true },
    capabilities: { type: [String], default: [] },
    compatibility: { type: String, default: 'compatible' },
  },
  { timestamps: true },
);

pluginSchema.index({ tenantId: 1, key: 1 }, { unique: true });

const Plugin = mongoose.models.Plugin || mongoose.model('Plugin', pluginSchema);

module.exports = { Plugin };
