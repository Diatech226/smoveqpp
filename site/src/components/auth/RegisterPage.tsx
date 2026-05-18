import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';


type IconProps = { className?: string; size?: number };

function IconBase({ className, size = 20, children }: React.PropsWithChildren<IconProps>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const Mail = (props: IconProps) => <IconBase {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></IconBase>;
const Lock = (props: IconProps) => <IconBase {...props}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></IconBase>;
const User = (props: IconProps) => <IconBase {...props}><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></IconBase>;
const UserPlus = (props: IconProps) => <IconBase {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></IconBase>;
const AlertCircle = (props: IconProps) => <IconBase {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></IconBase>;
const Sparkles = (props: IconProps) => <IconBase {...props}><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z"/><path d="m5 16 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z"/><path d="m4 14 .6 1.4L6 16l-1.4.6L4 18l-.6-1.4L2 16l1.4-.6L4 14Z"/></IconBase>;
const Check = (props: IconProps) => <IconBase {...props}><polyline points="20 6 9 17 4 12"/></IconBase>;
export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, registrationEnabled, cmsEnabled, authError, authNotice } = useAuth();
  const isFormDisabled = loading || !registrationEnabled || !cmsEnabled;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!cmsEnabled) {
      setError('Le CMS est actuellement désactivé dans cet environnement.');
      setLoading(false);
      return;
    }

    if (!registrationEnabled) {
      setError('L’inscription publique est désactivée. Contactez un administrateur.');
      setLoading(false);
      return;
    }

    if (!name || !email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    const result = await register(email, password, name);

    if (result.success) {
      window.location.hash = result.destination ?? 'home';
    } else {
      setError(result.error ?? authError ?? 'Cet email est déjà utilisé');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1f2d] via-[#1a2f3d] to-[#0d1f2d] flex items-center justify-center relative overflow-hidden py-12">
      {/* 3D Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              left: `${10 + i * 20}%`,
              top: `${20 + i * 15}%`,
              background: `radial-gradient(circle, ${
                i % 2 === 0 ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 179, 232, 0.1)'
              }, transparent)`,
            }}
            animate={{
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
              rotate: [0, -180, -360],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Grid Pattern */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(52, 199, 89, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(52, 199, 89, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-[#34c759] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Register Card */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        {/* Card Glow Effect */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-[#34c759] to-[#00b3e8] rounded-[24px] blur opacity-75"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />

        <div className="relative bg-white rounded-[24px] p-8 md:p-12 shadow-2xl">
          {/* Logo/Badge */}
          <motion.div
            className="text-center mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring", delay: 0.2 }}
          >
            <div className="bg-gradient-to-r from-[#34c759] to-[#00b3e8] p-1 rounded-[20px] inline-block mb-4">
              <div className="bg-white px-6 py-3 rounded-[18px] flex items-center gap-2">
                <Sparkles className="text-[#34c759]" size={24} />
                <span className="font-['ABeeZee:Regular',sans-serif] text-[24px] bg-gradient-to-r from-[#34c759] to-[#00b3e8] bg-clip-text text-transparent">
                  SMOVE
                </span>
              </div>
            </div>
            <h1 className="font-['Medula_One:Regular',sans-serif] text-[28px] tracking-[2.8px] uppercase text-[#273a41] mb-2">
              Inscription
            </h1>
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px] text-[#9ba1a4]">
              Créez votre compte client (accès CMS réservé aux admins)
            </p>
          </motion.div>

          {(!registrationEnabled || !cmsEnabled) && (
            <motion.div
              className="bg-amber-50 border border-amber-200 rounded-[12px] p-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px] text-amber-700 mb-1">
                Inscription indisponible
              </p>
              <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px] text-amber-700">
                L’inscription publique est actuellement désactivée pour cet environnement.
              </p>
            </motion.div>
          )}

          {authNotice && (
            <motion.div
              className="bg-emerald-50 border border-emerald-200 rounded-[12px] p-4 mb-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-emerald-700">
                {authNotice}
              </p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              className="bg-red-50 border border-red-200 rounded-[12px] p-4 mb-6 flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle className="text-red-500" size={20} />
              <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-red-700">
                {error}
              </p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block font-['Abhaya_Libre:Bold',sans-serif] text-[16px] text-[#273a41] mb-2">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ba1a4]" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#34c759] outline-none transition-colors font-['Abhaya_Libre:Regular',sans-serif] text-[16px]"
                  placeholder="Votre nom"
                  disabled={isFormDisabled}
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block font-['Abhaya_Libre:Bold',sans-serif] text-[16px] text-[#273a41] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ba1a4]" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#34c759] outline-none transition-colors font-['Abhaya_Libre:Regular',sans-serif] text-[16px]"
                  placeholder="votre@email.com"
                  disabled={isFormDisabled}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block font-['Abhaya_Libre:Bold',sans-serif] text-[16px] text-[#273a41] mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ba1a4]" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#34c759] outline-none transition-colors font-['Abhaya_Libre:Regular',sans-serif] text-[16px]"
                  placeholder="••••••••"
                  disabled={isFormDisabled}
                />
              </div>
              <p className="mt-1 font-['Abhaya_Libre:Regular',sans-serif] text-[12px] text-[#9ba1a4]">
                Minimum 8 caractères
              </p>
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block font-['Abhaya_Libre:Bold',sans-serif] text-[16px] text-[#273a41] mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ba1a4]" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#34c759] outline-none transition-colors font-['Abhaya_Libre:Regular',sans-serif] text-[16px]"
                  placeholder="••••••••"
                  disabled={isFormDisabled}
                />
                {confirmPassword && password === confirmPassword && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-[#34c759]" size={20} />
                )}
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-[#34c759] to-[#2da84a] text-white px-8 py-4 rounded-[12px] font-['Abhaya_Libre:Bold',sans-serif] text-[18px] flex items-center justify-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isFormDisabled}
            >
              {loading ? (
                <motion.div
                  className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <>
                  <UserPlus size={20} />
                  Créer mon compte
                </>
              )}
            </motion.button>
          </form>

          {/* Footer Links */}
          <motion.div
            className="mt-8 text-center space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#9ba1a4]">
              Déjà un compte?{' '}
              <a
                href="#login"
                className="text-[#34c759] font-['Abhaya_Libre:Bold',sans-serif] hover:underline"
              >
                Se connecter
              </a>
            </p>
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#9ba1a4]">
              <a
                href="#home"
                className="text-[#9ba1a4] hover:text-[#273a41] transition-colors"
              >
                ← Retour au site
              </a>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
