import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const envModulePath = require.resolve('../config/env');
const sessionModulePath = require.resolve('../config/session');

function withEnv(overrides, run) {
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
  delete require.cache[sessionModulePath];

  try {
    return run(require('../config/session'));
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    delete require.cache[envModulePath];
    delete require.cache[sessionModulePath];
  }
}

describe('session cors options', () => {
  it('returns exact allowed origin (not wildcard semantics) when credentials are enabled', async () => {
    const outcome = await withEnv(
      {
        NODE_ENV: 'production',
        FRONTEND_ORIGIN: 'https://smove-three.vercel.app',
        FRONTEND_ORIGINS: 'https://smove-three.vercel.app,https://smoovecms.vercel.app',
      },
      async ({ createCorsOptions }) => {
        const options = createCorsOptions();
        const credentials = options.credentials;
        const allowedOrigin = await new Promise((resolve, reject) => {
          options.origin('https://smoovecms.vercel.app', (error, value) => {
            if (error) return reject(error);
            return resolve(value);
          });
        });

        return { credentials, allowedOrigin };
      },
    );

    expect(outcome.credentials).toBe(true);
    expect(outcome.allowedOrigin).toBe('https://smoovecms.vercel.app');
  });


  it('falls back to normalized config origins when FRONTEND_ORIGINS env is empty', async () => {
    const outcome = await withEnv(
      {
        NODE_ENV: 'development',
        FRONTEND_ORIGINS: '',
        FRONTEND_ORIGIN: 'http://localhost:5173/',
        VITE_CMS_PORT: '5174',
      },
      async ({ createCorsOptions }) => {
        const options = createCorsOptions();
        const local = await new Promise((resolve, reject) => {
          options.origin('http://localhost:5173', (error, value) => (error ? reject(error) : resolve(value)));
        });
        const cms = await new Promise((resolve, reject) => {
          options.origin('http://localhost:5174', (error, value) => (error ? reject(error) : resolve(value)));
        });

        return { local, cms };
      },
    );

    expect(outcome).toEqual({
      local: 'http://localhost:5173',
      cms: 'http://localhost:5174',
    });
  });

  it('allows only origins explicitly listed in FRONTEND_ORIGINS', async () => {
    const outcome = await withEnv(
      {
        NODE_ENV: 'production',
        FRONTEND_ORIGINS: 'https://smove-three.vercel.app,https://smoovecms.vercel.app',
      },
      async ({ createCorsOptions }) => {
        const options = createCorsOptions();
        const siteOrigin = await new Promise((resolve, reject) => {
          options.origin('https://smove-three.vercel.app', (error, value) => (error ? reject(error) : resolve(value)));
        });
        const cmsOrigin = await new Promise((resolve, reject) => {
          options.origin('https://smoovecms.vercel.app', (error, value) => (error ? reject(error) : resolve(value)));
        });

        return { siteOrigin, cmsOrigin };
      },
    );

    expect(outcome).toEqual({
      siteOrigin: 'https://smove-three.vercel.app',
      cmsOrigin: 'https://smoovecms.vercel.app',
    });
  });
});
