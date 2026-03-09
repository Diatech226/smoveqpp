const mongoose = require('mongoose');

const audienceSegmentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true, lowercase: true },
    conditions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    priority: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

audienceSegmentSchema.index({ tenantId: 1, key: 1 }, { unique: true });

const contentVariantSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    contentType: { type: String, required: true, index: true },
    contentId: { type: String, required: true, index: true },
    label: { type: String, required: true },
    fields: { type: mongoose.Schema.Types.Mixed, default: {} },
    isDefaultFallback: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const personalizationRuleSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    segmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AudienceSegment', required: true, index: true },
    contentType: { type: String, required: true, index: true },
    contentId: { type: String, required: true, index: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentVariant', required: true },
    priority: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const AudienceSegment = mongoose.models.AudienceSegment || mongoose.model('AudienceSegment', audienceSegmentSchema);
const ContentVariant = mongoose.models.ContentVariant || mongoose.model('ContentVariant', contentVariantSchema);
const PersonalizationRule = mongoose.models.PersonalizationRule || mongoose.model('PersonalizationRule', personalizationRuleSchema);

module.exports = { AudienceSegment, ContentVariant, PersonalizationRule };
