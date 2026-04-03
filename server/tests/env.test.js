import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const envModulePath = require.resolve('../config/env');

function loadEnvWith(overrides) {
  const previous = new Map();
  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  delete require.cache[envModulePath];
  const loaded = require('../config/env');

  for (const [key, value] of previous.entries()) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  delete require.cache[envModulePath];
  return loaded;
}

describe('env frontend origins', () => {
  it('includes Vite CMS/public URLs as safe frontend origins for OAuth redirects', () => {
    const env = loadEnvWith({
      NODE_ENV: 'production',
      FRONTEND_ORIGIN: 'https://www.example.com',
      FRONTEND_ORIGINS: '',
      CMS_ORIGIN: undefined,
      CMS_FRONTEND_ORIGIN: undefined,
      VITE_CMS_APP_URL: 'https://cms.example.com/#cms',
      VITE_PUBLIC_SITE_URL: 'https://www.example.com/#home',
      VITE_PUBLIC_APP_URL: 'https://legacy.example.com/#home',
    });

    expect(env.FRONTEND_ORIGINS).toContain('https://www.example.com');
    expect(env.FRONTEND_ORIGINS).toContain('https://cms.example.com');
    expect(env.FRONTEND_ORIGINS).toContain('https://legacy.example.com');
  });
});
