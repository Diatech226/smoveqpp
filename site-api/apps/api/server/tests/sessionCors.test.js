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

  it('includes localhost and 127.0.0.1 origins in development', () => {
    const outcome = withEnv(
      {
        NODE_ENV: 'development',
        FRONTEND_ORIGINS: '',
        FRONTEND_ORIGIN: 'http://localhost:5173',
        VITE_CMS_PORT: '5174',
      },
      ({ createCorsOptions }) => {
        const options = createCorsOptions();
        return Promise.all([
          new Promise((resolve, reject) => {
            options.origin('http://localhost:5173', (error, value) => (error ? reject(error) : resolve(value)));
          }),
          new Promise((resolve, reject) => {
            options.origin('http://localhost:5174', (error, value) => (error ? reject(error) : resolve(value)));
          }),
          new Promise((resolve, reject) => {
            options.origin('http://127.0.0.1:5173', (error, value) => (error ? reject(error) : resolve(value)));
          }),
          new Promise((resolve, reject) => {
            options.origin('http://127.0.0.1:5174', (error, value) => (error ? reject(error) : resolve(value)));
          }),
        ]);
      },
    );

    return expect(outcome).resolves.toEqual([
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ]);
  });
});
