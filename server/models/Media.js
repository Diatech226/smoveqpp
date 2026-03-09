const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    filename: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    folder: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storageProvider: { type: String, default: 'local' },
  },
  { timestamps: true },
);

mediaSchema.index({ tenantId: 1, createdAt: -1 });
const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);
module.exports = { Media };
