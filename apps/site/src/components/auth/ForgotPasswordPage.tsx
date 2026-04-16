import { FormEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Veuillez renseigner votre email.');
      return;
    }

    setLoading(true);
    const result = await requestPasswordReset(email.trim());
    if (result.success) {
      setSuccess(result.infoMessage ?? 'Si ce compte existe, un email de réinitialisation a été envoyé.');
    } else {
      setError(result.error ?? 'Impossible de lancer la réinitialisation.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00b3e8]">SMOVE</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-slate-500">Nous vous enverrons un lien de réinitialisation.</p>

        {error ? <p className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"><AlertCircle size={16} className="mt-[1px] shrink-0" />{error}</p> : null}
        {success ? <p className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><CheckCircle2 size={16} className="mt-[1px] shrink-0" />{success}</p> : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-[#00b3e8]">
              <Mail size={16} className="text-slate-400" />
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border-0 py-2.5 text-sm outline-none" placeholder="vous@exemple.com" />
            </div>
          </label>
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00b3e8] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0097c4] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          <a href="#login" className="font-medium text-[#00b3e8] hover:underline">Retour à la connexion</a>
        </p>
      </div>
    </div>
  );
}
