const { createUserModel, normalizeEmail } = require('../models/User');

function mapMongoUser(doc) {
  if (!doc) return null;
  const accountStatus = doc.accountStatus ?? (['active', 'invited', 'suspended'].includes(doc.status) ? doc.status : 'active');
  return {
    id: String(doc._id),
    email: doc.email,
    passwordHash: doc.passwordHash,
    name: doc.name,
    role: doc.role,
    status: doc.status,
    accountStatus,
    authProvider: doc.authProvider,
    providerId: doc.providerId ?? null,
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
      passwordHash: input.passwordHash ?? null,
      name: input.name,
      role: input.role,
      status: input.status,
      accountStatus: input.accountStatus,
      authProvider: input.authProvider ?? 'local',
      providerId: input.providerId ?? null,
    });

    return mapMongoUser(user);
  }

  async findByEmailWithPassword(email) {
    const user = await this.UserModel.findOne({ email: normalizeEmail(email) }).exec();
    return mapMongoUser(user);
  }

  async findByProvider(authProvider, providerId) {
    const user = await this.UserModel.findOne({ authProvider, providerId: String(providerId) }).exec();
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

  async upsertOAuthUser({
    email,
    name,
    authProvider,
    providerId,
    role = 'viewer',
    status = 'client',
    accountStatus = 'active',
  }) {
    const user = await this.UserModel.findOneAndUpdate(
      {
        $or: [{ email: normalizeEmail(email) }, { authProvider, providerId: String(providerId) }],
      },
      {
        $set: {
          email: normalizeEmail(email),
          name,
          authProvider,
          providerId: String(providerId),
          status,
          accountStatus,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          role,
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      },
    ).exec();

    return mapMongoUser(user);
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
