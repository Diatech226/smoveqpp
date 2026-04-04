const { createApp } = require('./app');
const { connectMongo, getMongoose, getMongoConnectionState } = require('./config/mongo');
const {
  API_PORT,
  validateCriticalEnv,
  SEED_ADMIN_ON_START,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME,
  AUTH_STORAGE_MODE,
  SESSION_STORE_MODE,
  PUBLIC_REGISTRATION_ENABLED,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  APP_BASE_URL,
  isProduction,
} = require('./config/env');
const { MongoAuthRepository } = require('./repositories/authRepository.mongo');
const { MemoryAuthRepository } = require('./repositories/authRepository.memory');
const { AuthService } = require('./services/authService');
const { createOAuthConfig } = require('./config/passport');
const { EmailService } = require('./services/emailService');
const { logInfo, logWarn, logError } = require('./utils/logger');

async function bootstrap() {
  validateCriticalEnv();
  await connectMongo();

  const mongoose = getMongoose();
  const mongoState = getMongoConnectionState();
  const usingMongoAuth = Boolean(mongoose);

  if (!usingMongoAuth && (isProduction || AUTH_STORAGE_MODE === 'mongo')) {
    throw new Error(`[auth] MongoDB auth repository unavailable (reason=${mongoState.reason}).`);
  }

  const userRepository = usingMongoAuth ? new MongoAuthRepository({ mongoose }) : new MemoryAuthRepository();
  const oauthConfig = createOAuthConfig();
  const emailService = new EmailService({
    smtpHost: SMTP_HOST,
    smtpPort: SMTP_PORT,
    smtpSecure: SMTP_SECURE,
    smtpUser: SMTP_USER,
    smtpPass: SMTP_PASS,
    from: EMAIL_FROM,
    appBaseUrl: APP_BASE_URL,
  });
  const authService = new AuthService({
    userRepository,
    oauthProviders: {
      google: { enabled: oauthConfig.googleEnabled },
      facebook: { enabled: oauthConfig.facebookEnabled },
    },
    emailService,
  });

  logInfo('bootstrap_auth_storage', {
    storageMode: usingMongoAuth ? 'mongo' : 'memory',
    configuredAuthStorageMode: AUTH_STORAGE_MODE,
    configuredSessionStoreMode: SESSION_STORE_MODE,
    mongoState: mongoState.reason,
    publicRegistrationEnabled: PUBLIC_REGISTRATION_ENABLED,
    emailDeliveryMode: emailService.isDeliveryReady() ? 'smtp' : 'dev-fallback',
  });

  if (SEED_ADMIN_ON_START) {
    const seedResult = await authService.seedAdminFromEnv({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
    });

    if (!seedResult.ok) {
      logWarn('bootstrap_admin_seed_skipped', { reason: seedResult.reason ?? 'unknown' });
    } else if (seedResult.created) {
      logInfo('bootstrap_admin_seeded');
    } else {
      logInfo('bootstrap_admin_exists');
    }
  } else {
    logInfo('bootstrap_admin_seed_disabled');
  }

  const app = createApp({ authService });
  app.listen(API_PORT, () => {
    logInfo('bootstrap_server_started', { port: API_PORT });
  });
}

bootstrap().catch((error) => {
  logError('bootstrap_failed', { message: error?.message });
  process.exit(1);
});
