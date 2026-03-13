const USER_ROLES = ['admin', 'editor', 'author', 'viewer'];
const USER_STATUSES = ['active', 'invited', 'suspended'];

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function normalizeUserInput(input) {
  return {
    id: String(input.id),
    email: normalizeEmail(input.email),
    passwordHash: String(input.passwordHash),
    name: String(input.name).trim(),
    role: USER_ROLES.includes(input.role) ? input.role : 'viewer',
    status: USER_STATUSES.includes(input.status) ? input.status : 'active',
    tenantId: input.tenantId ?? null,
    lastLoginAt: input.lastLoginAt ?? null,
    emailVerified: Boolean(input.emailVerified),
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
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      role: {
        type: String,
        enum: USER_ROLES,
        default: 'viewer',
        index: true,
      },
      status: {
        type: String,
        enum: USER_STATUSES,
        default: 'active',
        index: true,
      },
      tenantId: {
        type: String,
        default: null,
      },
      emailVerified: {
        type: Boolean,
        default: false,
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

  schema.index({ role: 1, status: 1 });

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

module.exports = { USER_ROLES, USER_STATUSES, normalizeEmail, normalizeUserInput, createUserModel };
