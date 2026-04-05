import { describe, expect, it } from 'vitest';
import siteViteConfig from '../../vite.config';

describe('site vite config', () => {
  it('uses app-local root so index.html resolves from apps/site', async () => {
    const configFactory = siteViteConfig as unknown as (env: { mode: string }) => Promise<Record<string, unknown>> | Record<string, unknown>;
    const config = await configFactory({ mode: 'development' });

    expect(config.root).toBeDefined();
    expect(String(config.root)).toContain('apps/site');
  });

  it('keeps browser hostname canonicalized to localhost', async () => {
    const configFactory = siteViteConfig as unknown as (env: { mode: string }) => Promise<Record<string, unknown>> | Record<string, unknown>;
    const config = await configFactory({ mode: 'development' });

    expect(config.server).toMatchObject({ host: 'localhost' });
  });
});
