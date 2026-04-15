function createContactSubmissionModel(mongoose) {
  const modelName = 'ContactSubmission';
  if (mongoose.models[modelName]) return mongoose.models[modelName];

  const schema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160, index: true },
      subject: { type: String, required: true, trim: true, maxlength: 160 },
      message: { type: String, required: true, trim: true, maxlength: 5000 },
      phone: { type: String, trim: true, maxlength: 50, default: '' },
      source: { type: String, trim: true, maxlength: 200, default: 'website' },
      requestId: { type: String, trim: true, maxlength: 100, default: null },
      delivered: { type: Boolean, default: false },
      deliveryMode: { type: String, trim: true, maxlength: 50, default: null },
    },
    { timestamps: true },
  );

  return mongoose.model(modelName, schema);
}

module.exports = { createContactSubmissionModel };
