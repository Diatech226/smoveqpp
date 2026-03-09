const { fail } = require('../utils/apiResponse');

const Roles = Object.freeze({
  ADMIN: 'admin',
  EDITOR: 'editor',
  AUTHOR: 'author',
  VIEWER: 'viewer',
});

const Permissions = Object.freeze({
  POST_READ: 'post:read',
  POST_CREATE: 'post:create',
  POST_UPDATE: 'post:update',
  POST_PUBLISH: 'post:publish',
  POST_DELETE: 'post:delete',
  SETTINGS_UPDATE: 'settings:update',
  MEDIA_DELETE: 'media:delete',
  SERVICE_READ: 'service:read',
  SERVICE_CREATE: 'service:create',
  SERVICE_UPDATE: 'service:update',
});

const rolePermissions = Object.freeze({
  [Roles.ADMIN]: Object.values(Permissions),
  [Roles.EDITOR]: [
    Permissions.POST_READ,
    Permissions.POST_CREATE,
    Permissions.POST_UPDATE,
    Permissions.POST_DELETE,
    Permissions.SERVICE_READ,
    Permissions.SERVICE_CREATE,
    Permissions.SERVICE_UPDATE,
    Permissions.MEDIA_DELETE,
  ],
  [Roles.AUTHOR]: [
    Permissions.POST_READ,
    Permissions.POST_CREATE,
    Permissions.POST_UPDATE,
    Permissions.SERVICE_READ,
    Permissions.SERVICE_CREATE,
    Permissions.SERVICE_UPDATE,
  ],
  [Roles.VIEWER]: [Permissions.POST_READ, Permissions.SERVICE_READ],
});

function hasPermission(role, permission) {
  return (rolePermissions[role] ?? []).includes(permission);
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, 401, 'UNAUTHENTICATED', 'Authentication required');
    }

    if (!hasPermission(req.user.role, permission)) {
      return fail(
        res,
        403,
        'FORBIDDEN',
        `Role ${req.user.role} does not have permission ${permission}`,
      );
    }

    return next();
  };
}

module.exports = { Roles, Permissions, rolePermissions, hasPermission, requirePermission };
