export function resolveOAuthFailureMessage(resultError: string | null, authError: string | null): string {
  return resultError ?? authError ?? 'Connexion sociale impossible. Réessayez.';
}
