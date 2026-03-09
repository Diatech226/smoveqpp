const mongoose = require('mongoose');

const EXPERIMENT_STATUSES = ['draft', 'running', 'paused', 'stopped'];

const experimentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    name: { type: String, required: true, trim: true },
    contentType: { type: String, required: true, index: true },
    contentId: { type: String, required: true, index: true },
    status: { type: String, enum: EXPERIMENT_STATUSES, default: 'draft', index: true },
    split: { type: [Number], default: [50, 50] },
    variants: { type: [mongoose.Schema.Types.Mixed], default: [] },
    metrics: { impressions: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
  },
  { timestamps: true },
);

const Experiment = mongoose.models.Experiment || mongoose.model('Experiment', experimentSchema);

module.exports = { Experiment, EXPERIMENT_STATUSES };
