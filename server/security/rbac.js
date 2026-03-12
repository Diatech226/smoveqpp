const Roles = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  AUTHOR: 'author',
  VIEWER: 'viewer',
};

const Permissions = {
  CMS_ACCESS: 'cms:access',
  CONTENT_READ: 'content:read',
  CONTENT_WRITE: 'content:write',
  CONTENT_PUBLISH: 'content:publish',
  USER_MANAGE: 'user:manage',
};

const rolePermissions = {
  [Roles.ADMIN]: new Set(Object.values(Permissions)),
  [Roles.EDITOR]: new Set([
    Permissions.CMS_ACCESS,
    Permissions.CONTENT_READ,
    Permissions.CONTENT_WRITE,
    Permissions.CONTENT_PUBLISH,
  ]),
  [Roles.AUTHOR]: new Set([Permissions.CMS_ACCESS, Permissions.CONTENT_READ, Permissions.CONTENT_WRITE]),
  [Roles.VIEWER]: new Set([Permissions.CONTENT_READ]),
};

function hasPermission(role, permission) {
  const permissions = rolePermissions[role];
  return Boolean(permissions && permissions.has(permission));
}

module.exports = { Roles, Permissions, rolePermissions, hasPermission };
