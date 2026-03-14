const USER_ROLES = ['admin', 'editor', 'author', 'viewer', 'client'];
const USER_STATUSES = ['client', 'staff'];
const ACCOUNT_STATUSES = ['active', 'invited', 'suspended'];
const AUTH_PROVIDERS = ['local', 'google', 'facebook'];

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function normalizeUserInput(input) {
  return {
    id: String(input.id),
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash ? String(input.passwordHash) : null,
    name: String(input.name ?? '').trim(),
    role: USER_ROLES.includes(input.role) ? input.role : 'client',
    status: USER_STATUSES.includes(input.status) ? input.status : 'client',
    accountStatus: ACCOUNT_STATUSES.includes(input.accountStatus)
      ? input.accountStatus
      : (ACCOUNT_STATUSES.includes(input.status) ? input.status : 'active'),
    authProvider: AUTH_PROVIDERS.includes(input.authProvider) ? input.authProvider : 'local',
    providerId: input.providerId ? String(input.providerId) : null,
    lastLoginAt: input.lastLoginAt ?? null,
    createdAt: input.createdAt ?? new Date(),
    updatedAt: input.updatedAt ?? new Date(),
  };
}

function createUserModel(mongoose) {
  if (!mongoose) {
    throw new Error('mongoose instance is required to create User model');
  }

  if (mongoose.models.User) {
    return mongoose.models.User;
  }

  const schema = new mongoose.Schema(
    {
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
      },
      passwordHash: {
        type: String,
        default: null,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      role: {
        type: String,
        enum: USER_ROLES,
        default: 'client',
        index: true,
      },
      status: {
        type: String,
        enum: USER_STATUSES,
        default: 'client',
        index: true,
      },
      accountStatus: {
        type: String,
        enum: ACCOUNT_STATUSES,
        default: 'active',
        index: true,
      },
      authProvider: {
        type: String,
        enum: AUTH_PROVIDERS,
        default: 'local',
        index: true,
      },
      providerId: {
        type: String,
        default: null,
      },
      lastLoginAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
      collection: 'users',
    },
  );

  schema.index({ email: 1 }, { unique: true });
  schema.index({ authProvider: 1, providerId: 1 }, { unique: true, sparse: true });

  schema.pre('validate', function normalizeBeforeValidate(next) {
    if (this.email) {
      this.email = normalizeEmail(this.email);
    }
    if (this.name) {
      this.name = String(this.name).trim();
    }
    next();
  });

  return mongoose.model('User', schema);
}

module.exports = {
  USER_ROLES,
  USER_STATUSES,
  ACCOUNT_STATUSES,
  AUTH_PROVIDERS,
  normalizeEmail,
  normalizeUserInput,
  createUserModel,
};
