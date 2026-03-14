import { useState } from 'react';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenHint, setTokenHint] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTokenHint(null);

    if (!email.trim()) {
      setError('Veuillez renseigner votre email.');
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email.trim());
    if (!result.success) {
      setError(result.error ?? 'Impossible de traiter la demande.');
    } else {
      setSuccess('Si ce compte existe, un lien de réinitialisation a été généré.');
      if (result.resetToken) {
        setTokenHint(result.resetToken);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f9fa] py-24 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-[24px] shadow-sm border border-[#e5eff2] p-8">
        <h1 className="font-['Medula_One:Regular',sans-serif] text-[28px] tracking-[2.8px] uppercase text-[#273a41] mb-2">Mot de passe oublié</h1>
        <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px] text-[#607279] mb-8">Entrez votre email pour récupérer votre compte.</p>

        {error && <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 mb-4 flex gap-3 items-center"><AlertCircle className="text-red-500" size={20} /><p>{error}</p></div>}
        {success && <div className="bg-green-50 border border-green-200 rounded-[12px] p-4 mb-4 flex gap-3 items-center"><CheckCircle2 className="text-green-600" size={20} /><p>{success}</p></div>}

        {tokenHint && (
          <motion.div className="bg-[#f5f9fa] border border-[#d8e4e8] rounded-[12px] p-4 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[14px] text-[#273a41]">Dev token (email infra non configurée):</p>
            <p className="text-[12px] break-all text-[#00b3e8] mt-1">{tokenHint}</p>
            <a href={`#reset-password?token=${encodeURIComponent(tokenHint)}`} className="text-[13px] text-[#00b3e8] underline mt-2 inline-block">Ouvrir la réinitialisation</a>
          </motion.div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ba1a4]" size={20} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#00b3e8] outline-none" placeholder="votre@email.com" disabled={loading} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#00b3e8] to-[#00c0e8] text-white px-8 py-4 rounded-[12px] font-['Abhaya_Libre:Bold',sans-serif]">Envoyer</button>
        </form>
      </div>
    </div>
  );
}
