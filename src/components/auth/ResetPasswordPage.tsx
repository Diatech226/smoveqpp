import { useMemo, useState } from 'react';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function getTokenFromHash() {
  const [, query = ''] = window.location.hash.split('?');
  const params = new URLSearchParams(query);
  return params.get('token') ?? '';
}

export default function ResetPasswordPage() {
  const { resetPassword, authError } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const token = useMemo(() => getTokenFromHash(), []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Lien invalide: token manquant.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, password);
    if (result.success) {
      setSuccess('Mot de passe mis à jour. Vous êtes maintenant connecté.');
      window.setTimeout(() => {
        window.location.hash = result.destination ?? 'home';
      }, 800);
    } else {
      setError(result.error ?? authError ?? 'Impossible de réinitialiser le mot de passe.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f9fa] py-24 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-[24px] shadow-sm border border-[#e5eff2] p-8">
        <h1 className="font-['Medula_One:Regular',sans-serif] text-[28px] tracking-[2.8px] uppercase text-[#273a41] mb-2">Réinitialiser le mot de passe</h1>
        <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px] text-[#607279] mb-8">Choisissez un nouveau mot de passe.</p>

        {error && <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 mb-4 flex gap-3 items-center"><AlertCircle className="text-red-500" size={20} /><p>{error}</p></div>}
        {success && <div className="bg-green-50 border border-green-200 rounded-[12px] p-4 mb-4 flex gap-3 items-center"><CheckCircle2 className="text-green-600" size={20} /><p>{success}</p></div>}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ba1a4]" size={20} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#00b3e8] outline-none" placeholder="Nouveau mot de passe" disabled={loading} />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ba1a4]" size={20} />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#00b3e8] outline-none" placeholder="Confirmez le mot de passe" disabled={loading} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#00b3e8] to-[#00c0e8] text-white px-8 py-4 rounded-[12px] font-['Abhaya_Libre:Bold',sans-serif]">Réinitialiser</button>
        </form>
      </div>
    </div>
  );
}
