import { UserCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../Navigation';

export default function AccountPage() {
  const { user, canAccessCMS } = useAuth();

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

            <dl className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[#f5f9fa] rounded-[14px] p-4">
                <dt className="text-[#7b868c] text-[14px] font-['Abhaya_Libre:Bold',sans-serif]">Email</dt>
                <dd className="text-[#273a41] text-[16px] font-['Abhaya_Libre:Regular',sans-serif]">{user?.email}</dd>
              </div>
              <div className="bg-[#f5f9fa] rounded-[14px] p-4">
                <dt className="text-[#7b868c] text-[14px] font-['Abhaya_Libre:Bold',sans-serif]">Rôle</dt>
                <dd className="text-[#273a41] text-[16px] capitalize font-['Abhaya_Libre:Regular',sans-serif]">{user?.role}</dd>
              </div>
            </dl>

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
