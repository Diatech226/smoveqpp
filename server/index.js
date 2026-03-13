const { createApp } = require('./app');
const { connectMongo, getMongoose } = require('./config/mongo');
const { API_PORT, validateCriticalEnv, SEED_ADMIN_ON_START, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, AUTH_STORAGE_MODE, PUBLIC_REGISTRATION_ENABLED } = require('./config/env');
const { MongoAuthRepository } = require('./repositories/authRepository.mongo');
const { MemoryAuthRepository } = require('./repositories/authRepository.memory');
const { AuthService } = require('./services/authService');

async function bootstrap() {
  validateCriticalEnv();
  await connectMongo();

  const mongoose = getMongoose();
  const usingMongoAuth = Boolean(mongoose);
  const userRepository = usingMongoAuth ? new MongoAuthRepository({ mongoose }) : new MemoryAuthRepository();
  const authService = new AuthService({ userRepository });

  console.log(`[auth] storage_mode=${usingMongoAuth ? 'mongo' : 'memory'} (AUTH_STORAGE_MODE=${AUTH_STORAGE_MODE})`);
  console.log(`[auth] public_registration=${PUBLIC_REGISTRATION_ENABLED ? 'enabled' : 'disabled'}`);

  if (SEED_ADMIN_ON_START && mongoose) {
    const seedResult = await authService.seedAdminFromEnv({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
    });

    if (!seedResult.ok) {
      console.warn('[auth] admin seed skipped: invalid admin environment variables');
    } else if (seedResult.created) {
      console.log(`[auth] admin seeded for ${seedResult.user.email}`);
    } else {
      console.log('[auth] admin already exists, skipping seed');
    }
  } else if (SEED_ADMIN_ON_START && !mongoose) {
    console.warn('[auth] admin seed requested but MongoDB auth repository is not active.');
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
