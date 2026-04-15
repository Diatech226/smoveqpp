const { createContactSubmissionModel } = require('../models/ContactSubmission');

class MongoContactSubmissionRepository {
  constructor({ mongoose }) {
    this.ContactSubmissionModel = createContactSubmissionModel(mongoose);
  }

  async create(payload) {
    const doc = await this.ContactSubmissionModel.create(payload);
    return {
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      subject: doc.subject,
      message: doc.message,
      phone: doc.phone,
      source: doc.source,
      requestId: doc.requestId,
      delivered: Boolean(doc.delivered),
      deliveryMode: doc.deliveryMode ?? null,
      createdAt: doc.createdAt,
    };
  }
}

module.exports = { MongoContactSubmissionRepository };
