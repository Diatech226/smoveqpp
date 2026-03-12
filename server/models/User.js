const USER_ROLES = ['admin', 'editor', 'author', 'viewer'];
const USER_STATUSES = ['active', 'invited', 'suspended'];

function normalizeUserInput(input) {
  return {
    id: input.id,
    email: String(input.email).trim().toLowerCase(),
    passwordHash: input.passwordHash,
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

module.exports = { USER_ROLES, USER_STATUSES, normalizeUserInput };
