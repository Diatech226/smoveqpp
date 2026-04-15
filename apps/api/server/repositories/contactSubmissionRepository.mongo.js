const { createContactSubmissionModel } = require('../models/ContactSubmission');

class MongoContactSubmissionRepository {
  constructor({ mongoose }) {
    this.ContactSubmissionModel = createContactSubmissionModel(mongoose);
  }

  async create(payload) {
    const doc = await this.ContactSubmissionModel.create(payload);
    return this.serialize(doc);
  }

  async updateDeliveryStatus(id, payload) {
    const doc = await this.ContactSubmissionModel.findByIdAndUpdate(id, payload, { new: true });
    if (!doc) {
      throw new Error(`Contact submission ${id} not found for delivery update.`);
    }
    return this.serialize(doc);
  }

  serialize(doc) {
    return {
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      subject: doc.subject,
      message: doc.message,
      phone: doc.phone,
      source: doc.source,
      contextSlug: doc.contextSlug,
      contextLabel: doc.contextLabel,
      requestId: doc.requestId,
      delivered: Boolean(doc.delivered),
      deliveryMode: doc.deliveryMode ?? null,
      deliveryStatus: doc.deliveryStatus ?? 'received',
      deliveryError: doc.deliveryError ?? null,
      createdAt: doc.createdAt,
    };
  }
}

module.exports = { MongoContactSubmissionRepository };
