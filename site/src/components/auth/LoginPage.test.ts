import { describe, expect, it } from 'vitest';
import { resolveOAuthFailureMessage } from './loginPageState';

describe('LoginPage OAuth error handling', () => {
  it('prefers provider error when OAuth init fails', () => {
    expect(resolveOAuthFailureMessage('OAuth indisponible', 'fallback')).toBe('OAuth indisponible');
  });

  it('falls back to auth context error when provider message is missing', () => {
    expect(resolveOAuthFailureMessage(null, 'Contexte auth indisponible')).toBe('Contexte auth indisponible');
  });

  it('uses recoverable default when both errors are missing', () => {
    expect(resolveOAuthFailureMessage(null, null)).toBe('Connexion sociale impossible. Réessayez.');
  });
});
