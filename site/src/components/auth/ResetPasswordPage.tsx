import { FormEvent, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function getResetTokenFromHash(): string {
  const rawHash = window.location.hash ?? '';
  const [, hashQuery = ''] = rawHash.split('?');
  return new URLSearchParams(hashQuery).get('token') ?? '';
}

export default function ResetPasswordPage() {
  const { confirmPasswordReset } = useAuth();
  const token = useMemo(() => getResetTokenFromHash(), []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Lien de réinitialisation invalide.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const result = await confirmPasswordReset(token, password);
    if (result.success) {
      setSuccess(result.infoMessage ?? 'Mot de passe mis à jour.');
      window.setTimeout(() => {
        window.location.hash = 'login';
      }, 900);
    } else {
      setError(result.error ?? 'Impossible de mettre à jour le mot de passe.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00b3e8]">SMOVE</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Réinitialiser le mot de passe</h1>
        <p className="mt-1 text-sm text-slate-500">Choisissez un nouveau mot de passe sécurisé.</p>

        {error ? <p className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"><AlertCircle size={16} className="mt-[1px] shrink-0" />{error}</p> : null}
        {success ? <p className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><CheckCircle2 size={16} className="mt-[1px] shrink-0" />{success}</p> : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Nouveau mot de passe</span>
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-[#00b3e8]">
              <Lock size={16} className="text-slate-400" />
              <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border-0 py-2.5 text-sm outline-none" placeholder="••••••••" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Confirmer le mot de passe</span>
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-[#00b3e8]">
              <Lock size={16} className="text-slate-400" />
              <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full border-0 py-2.5 text-sm outline-none" placeholder="••••••••" />
            </div>
          </label>
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00b3e8] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0097c4] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
