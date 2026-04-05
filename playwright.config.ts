import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      AUTH_STORAGE_MODE: 'memory',
      SESSION_STORE_MODE: 'memory',
      SEED_ADMIN_ON_START: 'true',
      ADMIN_EMAIL: 'admin@smove.test',
      ADMIN_PASSWORD: 'AdminPass123!',
      ADMIN_NAME: 'Admin QA',
      SESSION_SECRET: 'dev-super-secret-session-key-1234567890',
      PUBLIC_REGISTRATION_ENABLED: 'true',
      VITE_ENABLE_CMS: 'true',
      VITE_ENABLE_REGISTRATION: 'true',
    },
  },
});
