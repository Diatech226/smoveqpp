const assert = require('assert');
const { createAuthRateLimiter } = require('../server/middleware/authRateLimit');
const { AuthService } = require('../server/services/authService');

async function run() {
  const limiter = createAuthRateLimiter({ windowMs: 1000, max: 1 });
  let blocked = false;
  const req = { ip: '1.1.1.1' };
  const res = {
    headers: {},
    statusCode: 200,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };

  limiter(req, res, () => {});
  limiter(req, res, () => {});
  blocked = res.statusCode === 429;
  assert.equal(blocked, true, 'rate limiter must block repeated attempts');

  const users = [];
  const repo = {
    existsByEmail: async (email) => users.some((u) => u.email === email),
    create: async (input) => {
      const user = { id: String(users.length + 1), ...input, createdAt: new Date(), updatedAt: new Date() };
      users.push(user);
      return user;
    },
    findByEmailWithPassword: async (email) => users.find((u) => u.email === email) ?? null,
    findById: async (id) => users.find((u) => u.id === String(id)) ?? null,
    updateLastLoginAt: async () => null,
  };
  const service = new AuthService({ userRepository: repo });
  await service.register({ email: 'x@test.com', password: 'password123', name: 'X' });
  const login = await service.login({ email: 'x@test.com', password: 'password123' });
  assert.equal(login.ok, true, 'valid login must pass');

  console.log('Auth smoke tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
