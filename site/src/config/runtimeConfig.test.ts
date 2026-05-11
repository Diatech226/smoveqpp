import { describe, expect, it } from 'vitest';
import { RUNTIME_CONFIG } from './runtimeConfig';

describe('runtimeConfig', () => {
  it('provides safe normalized api base url', () => {
    expect(RUNTIME_CONFIG.apiBaseUrl.length).toBeGreaterThan(0);
    expect(RUNTIME_CONFIG.apiBaseUrl.endsWith('/')).toBe(false);
  });

  it('enforces minimum request timeout', () => {
    expect(RUNTIME_CONFIG.requestTimeoutMs).toBeGreaterThanOrEqual(1000);
  });
});
