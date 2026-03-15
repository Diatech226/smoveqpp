import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

function parsePort(rawValue: string | undefined, fallback: number): number {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const cmsPort = parsePort(env.VITE_CMS_PORT, 5174);
  const apiOrigin = env.VITE_API_ORIGIN ?? 'http://localhost:3001';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../src'),
      },
    },
    server: {
      port: cmsPort,
      strictPort: true,
      fs: {
        allow: ['..'],
      },
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: cmsPort,
      strictPort: true,
    },
  };
});
