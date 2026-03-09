const mongoose = require('mongoose');

const cmsSettingsSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', unique: true, index: true },
    textLogo: { type: String, default: 'SMOVE' },
    heroVideoUrl: { type: String, default: '' },
    socialLinks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    brandTokens: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

const CmsSettings = mongoose.models.CmsSettings || mongoose.model('CmsSettings', cmsSettingsSchema);
module.exports = { CmsSettings };
