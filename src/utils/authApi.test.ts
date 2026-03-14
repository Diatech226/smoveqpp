import { describe, expect, it } from 'vitest';
import { normalizeAuthPayload } from './authApi';

describe('normalizeAuthPayload', () => {
  it('returns successful result for valid successful response', () => {
    const result = normalizeAuthPayload(
      {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'admin@company.test',
            name: 'Admin',
            role: 'admin',
          },
          csrfToken: 'token-1',
        },
      },
      200,
    );

    expect(result.success).toBe(true);
    expect(result.user?.id).toBe('1');
    expect(result.errorMessage).toBeNull();
  });

  it('normalizes auth failures with explicit backend error details', () => {
    const result = normalizeAuthPayload(
      {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
        },
      },
      401,
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_CREDENTIALS');
    expect(result.errorMessage).toBe('Invalid credentials');
  });


  it('maps duplicate email errors to localized fallback message', () => {
    const result = normalizeAuthPayload(
      {
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
        },
      },
      409,
    );

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Un compte existe déjà avec cet email.');
  });


  it('maps validation errors to localized fallback message', () => {
    const result = normalizeAuthPayload(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      },
      400,
    );

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Vérifiez les champs saisis.');
  });



  it('maps reset token errors to localized fallback message', () => {
    const result = normalizeAuthPayload(
      {
        success: false,
        error: {
          code: 'RESET_TOKEN_INVALID',
        },
      },
      400,
    );

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Le lien de réinitialisation est invalide ou expiré.');
  });

  it('provides fallback message when payload is malformed', () => {
    const result = normalizeAuthPayload(null, 500);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Erreur serveur. Réessayez plus tard.');
  });
});
