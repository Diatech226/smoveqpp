const { createUserModel, normalizeEmail } = require('../models/User');

function mapMongoUser(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    email: doc.email,
    passwordHash: doc.passwordHash,
    name: doc.name,
    role: doc.role,
    status: doc.status,
    tenantId: doc.tenantId ?? null,
    emailVerified: Boolean(doc.emailVerified),
    lastLoginAt: doc.lastLoginAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

class MongoAuthRepository {
  constructor({ mongoose }) {
    this.UserModel = createUserModel(mongoose);
  }

  async create(input) {
    const user = await this.UserModel.create({
      email: normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      name: input.name,
      role: input.role,
      status: input.status,
      tenantId: input.tenantId ?? null,
      emailVerified: Boolean(input.emailVerified),
    });

    return mapMongoUser(user);
  }

  async findByEmailWithPassword(email) {
    const user = await this.UserModel.findOne({ email: normalizeEmail(email) }).exec();
    return mapMongoUser(user);
  }

  async findById(id) {
    const user = await this.UserModel.findById(id).exec();
    return mapMongoUser(user);
  }

  async existsByEmail(email) {
    const count = await this.UserModel.countDocuments({ email: normalizeEmail(email) }).exec();
    return count > 0;
  }

  async updateLastLoginAt(id, date) {
    const user = await this.UserModel.findByIdAndUpdate(
      id,
      {
        $set: {
          lastLoginAt: date,
          updatedAt: new Date(),
        },
      },
      { new: true },
    ).exec();

    return mapMongoUser(user);
  }
}

module.exports = { MongoAuthRepository };
