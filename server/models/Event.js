const mongoose = require('mongoose');

const EVENT_STATUSES = ['draft', 'published', 'archived'];

const eventSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 180 },
    slug: { type: String, required: true, trim: true, lowercase: true, minlength: 3, maxlength: 200 },
    description: { type: String, default: '' },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, default: null },
    location: { type: String, default: '' },
    status: { type: String, enum: EVENT_STATUSES, default: 'draft', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

eventSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
module.exports = { Event, EVENT_STATUSES };
