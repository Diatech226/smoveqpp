import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

function parsePort(rawValue: string | undefined, fallback: number): number {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeApiOrigin(rawValue: string | undefined, fallbackPort: number): string {
  const trimmed = rawValue?.trim();
  const candidate = trimmed && trimmed.length > 0 ? trimmed : `http://127.0.0.1:${fallbackPort}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.hostname === 'localhost') {
      parsed.hostname = '127.0.0.1';
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return `http://127.0.0.1:${fallbackPort}`;
  }
}

export default defineConfig(({ mode }) => {
  const workspaceRoot = path.resolve(__dirname, '../..');
  const workspaceEnv = loadEnv(mode, workspaceRoot, '');
  const cmsEnv = loadEnv(mode, __dirname, '');
  const env = { ...workspaceEnv, ...cmsEnv };

  const cmsPort = parsePort(env.VITE_CMS_PORT, 5174);
  const apiPort = parsePort(env.API_PORT, 3001);
  const apiOrigin = normalizeApiOrigin(env.VITE_API_ORIGIN ?? env.API_ORIGIN, apiPort);

  return {
    base: '/cms/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: '../../build/cms',
      emptyOutDir: false,
    },
    server: {
      host: '127.0.0.1',
      port: cmsPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: apiOrigin,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: '127.0.0.1',
      port: cmsPort,
      strictPort: true,
    },
  };
});
