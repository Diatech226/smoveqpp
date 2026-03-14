import { useEffect, useState } from 'react';
import { User, Mail, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

export default function AccountPage() {
  const { user, updateProfile, authError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user]);


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Le nom est requis.');
      return;
    }

    setLoading(true);
    const result = await updateProfile({ name: name.trim(), email: email.trim() || undefined });

    if (result.success) {
      setSuccess('Votre profil a été mis à jour.');
    } else {
      setError(result.error ?? authError ?? 'Impossible de mettre à jour le profil.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f9fa] py-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-[24px] shadow-sm border border-[#e5eff2] p-8">
          <h1 className="font-['Medula_One:Regular',sans-serif] text-[28px] tracking-[2.8px] uppercase text-[#273a41] mb-2">Mon compte</h1>
          <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px] text-[#607279] mb-8">Gérez vos informations de profil de base.</p>

          {error && (
            <motion.div className="bg-red-50 border border-red-200 rounded-[12px] p-4 mb-4 flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AlertCircle className="text-red-500" size={20} />
              <p className="font-['Abhaya_Libre:Regular',sans-serif] text-red-700">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div className="bg-green-50 border border-green-200 rounded-[12px] p-4 mb-4 flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CheckCircle2 className="text-green-600" size={20} />
              <p className="font-['Abhaya_Libre:Regular',sans-serif] text-green-700">{success}</p>
            </motion.div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block font-['Abhaya_Libre:Bold',sans-serif] text-[16px] text-[#273a41] mb-2">Nom</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ba1a4]" size={20} />
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#00b3e8] outline-none" disabled={loading} />
              </div>
            </div>

            <div>
              <label className="block font-['Abhaya_Libre:Bold',sans-serif] text-[16px] text-[#273a41] mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ba1a4]" size={20} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#00b3e8] outline-none" disabled={loading} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#00b3e8] to-[#00c0e8] text-white px-8 py-4 rounded-[12px] font-['Abhaya_Libre:Bold',sans-serif] text-[18px] flex items-center justify-center gap-2">
              <Save size={18} />
              Enregistrer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
