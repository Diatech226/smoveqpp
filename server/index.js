const { createApp } = require('./app');
const { connectMongo, getMongoose, getMongoConnectionState } = require('./config/mongo');
const { API_PORT, validateCriticalEnv, SEED_ADMIN_ON_START, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, AUTH_STORAGE_MODE, PUBLIC_REGISTRATION_ENABLED } = require('./config/env');
const { MongoAuthRepository } = require('./repositories/authRepository.mongo');
const { MemoryAuthRepository } = require('./repositories/authRepository.memory');
const { AuthService } = require('./services/authService');

async function bootstrap() {
  validateCriticalEnv();
  await connectMongo();

  const mongoose = getMongoose();
  const mongoState = getMongoConnectionState();
  const usingMongoAuth = Boolean(mongoose);
  const userRepository = usingMongoAuth ? new MongoAuthRepository({ mongoose }) : new MemoryAuthRepository();
  const authService = new AuthService({ userRepository });

  if (usingMongoAuth) {
    console.log('[auth] MongoDB connected');
  } else {
    console.warn(`[auth] using in-memory auth fallback (reason=${mongoState.reason})`);
  }

  console.log(`[auth] storage_mode=${usingMongoAuth ? 'mongo' : 'memory'} (AUTH_STORAGE_MODE=${AUTH_STORAGE_MODE})`);
  console.log(`[auth] public_registration=${PUBLIC_REGISTRATION_ENABLED ? 'enabled' : 'disabled'}`);

  if (SEED_ADMIN_ON_START) {
    const seedResult = await authService.seedAdminFromEnv({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
    });

    if (!seedResult.ok) {
      console.warn('[auth] admin seed skipped');
    } else if (seedResult.created) {
      console.log('[auth] admin seeded');
    } else {
      console.log('[auth] admin already exists');
    }
  } else {
    console.log('[auth] admin seed skipped');
  }

  const app = createApp({ authService });
  app.listen(API_PORT, () => {
    console.log(`Auth server listening on http://localhost:${API_PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('[bootstrap] failed:', error);
  process.exit(1);
});
