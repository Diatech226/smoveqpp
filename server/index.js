const { createApp } = require('./app');
const { connectMongo } = require('./config/mongo');
const { API_PORT, validateCriticalEnv } = require('./config/env');

async function bootstrap() {
  validateCriticalEnv();
  await connectMongo();
  const app = createApp();
  app.listen(API_PORT, () => {
    console.log(`Auth server listening on http://localhost:${API_PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('[bootstrap] failed:', error);
  process.exit(1);
});
