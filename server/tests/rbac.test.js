import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { Roles, Permissions, hasPermission } = require('../security/rbac');

describe('rbac permissions', () => {
  it('allows admin on user manage', () => {
    expect(hasPermission(Roles.ADMIN, Permissions.USER_MANAGE)).toBe(true);
  });

  it('denies viewer cms access', () => {
    expect(hasPermission(Roles.VIEWER, Permissions.CMS_ACCESS)).toBe(false);
  });
});
