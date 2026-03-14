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
    emailVerified: Boolean(doc.emailVerified),
    emailVerificationTokenHash: doc.emailVerificationTokenHash ?? null,
    emailVerificationTokenExpiresAt: doc.emailVerificationTokenExpiresAt ?? null,
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
      emailVerified: Boolean(input.emailVerified),
      emailVerificationTokenHash: input.emailVerificationTokenHash ?? null,
      emailVerificationTokenExpiresAt: input.emailVerificationTokenExpiresAt ?? null,
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

  async findByEmailVerificationTokenHash(tokenHash) {
    const user = await this.UserModel.findOne({ emailVerificationTokenHash: String(tokenHash) }).exec();
    return mapMongoUser(user);
  }

  async findById(id) {
    const user = await this.UserModel.findById(id).exec();
    return mapMongoUser(user);
  }

  async listUsers() {
    const docs = await this.UserModel.find({}).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => mapMongoUser(doc));
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
    emailVerified = true,
    emailVerificationTokenHash = null,
    emailVerificationTokenExpiresAt = null,
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
          emailVerified,
          emailVerificationTokenHash,
          emailVerificationTokenExpiresAt,
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

  async setEmailVerificationToken(id, { tokenHash, expiresAt }) {
    const user = await this.UserModel.findByIdAndUpdate(
      id,
      {
        $set: {
          emailVerificationTokenHash: String(tokenHash),
          emailVerificationTokenExpiresAt: expiresAt,
          updatedAt: new Date(),
        },
      },
      { new: true },
    ).exec();

    return mapMongoUser(user);
  }

  async markEmailVerified(id) {
    const user = await this.UserModel.findByIdAndUpdate(
      id,
      {
        $set: {
          emailVerified: true,
          emailVerificationTokenHash: null,
          emailVerificationTokenExpiresAt: null,
          updatedAt: new Date(),
        },
      },
      { new: true },
    ).exec();

    return mapMongoUser(user);
  }

  async updateUser(id, patch) {
    const user = await this.UserModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...patch,
          updatedAt: new Date(),
        },
      },
      { new: true },
    ).exec();

    return mapMongoUser(user);
  }
}

module.exports = { MongoAuthRepository };
