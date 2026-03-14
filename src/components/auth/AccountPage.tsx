import { UserCircle2, ShieldCheck, BadgeCheck, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../Navigation';

export default function AccountPage() {
  const { user, canAccessCMS, sessionState, resendVerification, verifyEmail, authNotice, clearAuthNotice } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onResend = async () => {
    setBusy(true);
    setError(null);
    const result = await resendVerification();
    if (!result.success) {
      setError(result.error ?? 'Impossible de renvoyer le lien de vérification.');
    }
    setBusy(false);
  };

  const onVerify = async () => {
    const token = window.prompt('Collez le token de vérification reçu par email');
    if (!token) return;
    setBusy(true);
    setError(null);
    const result = await verifyEmail(token);
    if (!result.success) {
      setError(result.error ?? 'Vérification impossible.');
    }
    setBusy(false);
  };

  return (
    <>
      <Navigation currentPath="/account" />
      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-[#f7fafc] min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#eef3f5] p-6 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <UserCircle2 className="text-[#00b3e8]" size={28} />
              <h1 className="font-['Medula_One:Regular',sans-serif] text-[32px] tracking-[1.5px] text-[#273a41] uppercase">
                Mon compte
              </h1>
            </div>

            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[18px] text-[#4a5960] mb-8">
              Vous êtes connecté en tant que <strong>{user?.name ?? 'Utilisateur'}</strong>.
            </p>

            {authNotice ? (
              <div className="mb-4 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start justify-between gap-3">
                <p className="text-emerald-800 text-[14px]">{authNotice}</p>
                <button type="button" className="text-emerald-700 text-[12px]" onClick={clearAuthNotice}>Fermer</button>
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-[14px]">{error}</div>
            ) : null}

            <dl className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[#f5f9fa] rounded-[14px] p-4">
                <dt className="text-[#7b868c] text-[14px] font-['Abhaya_Libre:Bold',sans-serif]">Email</dt>
                <dd className="text-[#273a41] text-[16px] font-['Abhaya_Libre:Regular',sans-serif]">{user?.email}</dd>
              </div>
              <div className="bg-[#f5f9fa] rounded-[14px] p-4">
                <dt className="text-[#7b868c] text-[14px] font-['Abhaya_Libre:Bold',sans-serif]">Rôle</dt>
                <dd className="text-[#273a41] text-[16px] capitalize font-['Abhaya_Libre:Regular',sans-serif]">{user?.role}</dd>
              </div>
              <div className="bg-[#f5f9fa] rounded-[14px] p-4">
                <dt className="text-[#7b868c] text-[14px] font-['Abhaya_Libre:Bold',sans-serif]">Compte</dt>
                <dd className="text-[#273a41] text-[16px] capitalize font-['Abhaya_Libre:Regular',sans-serif]">{user?.accountStatus ?? 'active'}</dd>
              </div>
              <div className="bg-[#f5f9fa] rounded-[14px] p-4">
                <dt className="text-[#7b868c] text-[14px] font-['Abhaya_Libre:Bold',sans-serif]">Authentification</dt>
                <dd className="text-[#273a41] text-[16px] capitalize font-['Abhaya_Libre:Regular',sans-serif]">{user?.authProvider ?? sessionState?.authProvider ?? 'local'}</dd>
              </div>
            </dl>

            <div className="mt-6 rounded-[14px] border border-[#eef3f5] p-4 bg-[#fcfefe]">
              <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41] mb-2">Sécurité du compte</p>
              <div className="flex items-center gap-2 text-[14px] mb-3">
                {user?.emailVerified ? (
                  <>
                    <BadgeCheck className="text-emerald-600" size={16} />
                    <span className="text-emerald-700">Email vérifié</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-amber-600" size={16} />
                    <span className="text-amber-700">Email non vérifié</span>
                  </>
                )}
              </div>
              {!user?.emailVerified && user?.verificationMethod === 'email_token' ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={busy}
                    className="px-3 py-2 border border-[#d8e4e8] rounded-[10px] inline-flex items-center gap-2 text-[14px]"
                  >
                    <RefreshCcw size={14} /> Renvoyer le lien
                  </button>
                  <button
                    type="button"
                    onClick={onVerify}
                    disabled={busy}
                    className="px-3 py-2 bg-[#00b3e8] text-white rounded-[10px] text-[14px]"
                  >
                    Vérifier mon email
                  </button>
                </div>
              ) : null}
              {sessionState?.authenticatedAt ? (
                <p className="mt-3 text-[12px] text-[#7b868c]">Session active depuis {new Date(sessionState.authenticatedAt).toLocaleString('fr-FR')}.</p>
              ) : null}
            </div>

            {canAccessCMS && (
              <a
                href="#cms-dashboard"
                className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-[#a855f7] to-[#9333ea] text-white px-5 py-3 rounded-[12px] font-['Abhaya_Libre:Bold',sans-serif]"
              >
                <ShieldCheck size={18} />
                Accéder au CMS
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
