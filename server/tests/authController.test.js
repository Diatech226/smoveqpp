import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { buildAuthController } = require('../controllers/authController');

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    clearCookie() {
      return this;
    },
  };
}

describe('auth controller session and logout', () => {
  it('session returns null user when unauthenticated', async () => {
    const authController = buildAuthController({ authService: { getSessionUser: async () => null } });
    const req = { session: {} };
    const res = createRes();

    await authController.getSession(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user).toBeNull();
    expect(typeof res.body.data.csrfToken).toBe('string');
  });

  it('logout destroys session cleanly', async () => {
    const authController = buildAuthController({ authService: {} });
    const req = { session: { destroy: (cb) => cb() } };
    const res = createRes();

    await authController.logout(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user).toBeNull();
  });
});
