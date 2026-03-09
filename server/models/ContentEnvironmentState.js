const mongoose = require('mongoose');

const ENVIRONMENTS = ['draft', 'staging', 'production'];

const contentEnvironmentStateSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    contentType: { type: String, required: true, index: true },
    contentId: { type: String, required: true, index: true },
    environments: {
      draft: { type: Boolean, default: true },
      staging: { type: Boolean, default: false },
      production: { type: Boolean, default: false },
    },
    lastPromotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastPromotionAt: { type: Date, default: null },
  },
  { timestamps: true },
);

contentEnvironmentStateSchema.index({ tenantId: 1, contentType: 1, contentId: 1 }, { unique: true });

const ContentEnvironmentState = mongoose.models.ContentEnvironmentState || mongoose.model('ContentEnvironmentState', contentEnvironmentStateSchema);

module.exports = { ContentEnvironmentState, ENVIRONMENTS };
