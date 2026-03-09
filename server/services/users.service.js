const bcrypt = require('bcryptjs');
const { Roles } = require('../security/permissions');
const { listUsers, findByEmail, createUser, findUserById } = require('../repositories/users.repository');

const USER_STATUSES = ['active', 'inactive', 'invited'];
const USER_ROLES = Object.values(Roles);

function parsePagination(query) {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit ?? 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

async function getUsers({ tenantId, query }) {
  const { page, limit, offset } = parsePagination(query);
  const [items, total] = await listUsers({ tenantId, query: typeof query.q === 'string' ? query.q.trim() : '', role: typeof query.role === 'string' ? query.role : undefined, status: typeof query.status === 'string' ? query.status : undefined, limit, offset });
  return { items: items.map((user) => ({ id: String(user._id), email: user.email, name: user.name, role: user.role, status: user.status ?? 'active', createdAt: user.createdAt, updatedAt: user.updatedAt })), pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
}

async function inviteUser({ tenantId, actor, payload }) {
  const email = String(payload.email ?? '').trim().toLowerCase();
  const name = String(payload.name ?? '').trim();
  const role = String(payload.role ?? Roles.VIEWER);
  if (!email.includes('@')) throw new Error('EMAIL_INVALID');
  if (name.length < 2) throw new Error('NAME_INVALID');
  if (!USER_ROLES.includes(role)) throw new Error('ROLE_INVALID');
  if (await findByEmail(tenantId, email)) throw new Error('USER_EXISTS');
  const generatedPassword = Math.random().toString(36).slice(-12);
  const user = await createUser({ tenantId, email, name, role, status: 'invited', invitedBy: actor._id, passwordHash: await bcrypt.hash(generatedPassword, 10), provider: 'local' });
  return { id: String(user._id), email: user.email, name: user.name, role: user.role, status: user.status };
}

async function updateUserRole({ tenantId, userId, role }) {
  if (!USER_ROLES.includes(role)) throw new Error('ROLE_INVALID');
  const user = await findUserById(tenantId, userId);
  if (!user) throw new Error('USER_NOT_FOUND');
  user.role = role;
  await user.save();
  return { id: String(user._id), role: user.role };
}

async function updateUserStatus({ tenantId, userId, status }) {
  if (!USER_STATUSES.includes(status)) throw new Error('STATUS_INVALID');
  const user = await findUserById(tenantId, userId);
  if (!user) throw new Error('USER_NOT_FOUND');
  user.status = status;
  await user.save();
  return { id: String(user._id), status: user.status };
}

module.exports = { getUsers, inviteUser, updateUserRole, updateUserStatus };
