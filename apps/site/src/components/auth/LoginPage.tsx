import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { resolveOAuthFailureMessage } from './loginPageState';

export default function LoginPage() {
  const enableGoogle = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === 'true';
  const enableFacebook = import.meta.env.VITE_ENABLE_FACEBOOK_LOGIN === 'true';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<'google' | 'facebook' | null>(null);
  const { login, beginOAuthLogin, oauthProviders, cmsEnabled, registrationEnabled, authError, authNotice } = useAuth();
  const showGoogleLogin = enableGoogle && oauthProviders.google;
  const showFacebookLogin = enableFacebook && oauthProviders.facebook;
  const hasSocialLogin = showGoogleLogin || showFacebookLogin;
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 2,
      })),
    [],
  );

  useEffect(() => {
    if (!hasSocialLogin) return;

    const rawHash = window.location.hash ?? '';
    const [, hashQuery = ''] = rawHash.split('?');
    if (!hashQuery) return;

    const params = new URLSearchParams(hashQuery);
    const oauthErrorCode = params.get('oauthError');
    if (!oauthErrorCode) return;

    const knownErrors: Record<string, string> = {
      OAUTH_PROVIDER_DISABLED: 'Connexion sociale indisponible: provider non configuré côté serveur.',
      OAUTH_STATE_INVALID: 'Connexion sociale interrompue (état OAuth invalide). Merci de réessayer.',
      OAUTH_CODE_MISSING: 'Connexion sociale interrompue: code OAuth manquant.',
      OAUTH_EMAIL_REQUIRED: "Facebook ne nous a pas transmis d'email. Autorisez l'email ou utilisez un autre mode de connexion.",
      OAUTH_ACCOUNT_CONFLICT: 'Un compte existe déjà avec cet email/provider. Contactez un administrateur si nécessaire.',
      OAUTH_TOKEN_EXCHANGE_FAILED: "Le provider a refusé l'échange du code OAuth. Vérifiez la configuration callback/secret.",
      OAUTH_PROFILE_FETCH_FAILED: 'Impossible de récupérer le profil social. Réessayez dans quelques instants.',
      SESSION_ERROR: 'Session serveur indisponible. Merci de réessayer.',
    };

    setError(knownErrors[oauthErrorCode] ?? `Connexion sociale impossible (${oauthErrorCode}).`);
    setOauthLoadingProvider(null);
  }, [hasSocialLogin]);

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setError('');
    setOauthLoadingProvider(provider);
    const result = await beginOAuthLogin(provider);
    if (!result.success) {
      setError(resolveOAuthFailureMessage(result.error, authError));
      setOauthLoadingProvider(null);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!cmsEnabled) {
      setError('Le CMS est actuellement désactivé dans cet environnement.');
      setLoading(false);
      return;
    }

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      const result = await login(email, password);

      if (result.success) {
        const destination = result.destination ?? 'home';
        if (window.location.hash !== `#${destination}`) {
          window.location.hash = destination;
        }
        return;
      }

      setError(result.error ?? authError ?? 'Email ou mot de passe incorrect');
    } catch (_error) {
      setError(authError ?? 'Connexion impossible. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1f2d] via-[#1a2f3d] to-[#0d1f2d] flex items-center justify-center relative overflow-hidden">
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
                i % 2 === 0 ? 'rgba(0, 179, 232, 0.1)' : 'rgba(52, 199, 89, 0.1)'
              }, transparent)`,
            }}
            animate={{
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
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
              linear-gradient(rgba(0, 179, 232, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 179, 232, 0.1) 1px, transparent 1px)
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
        {particles.map((particle, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-[#00b3e8] rounded-full"
            style={{
              left: particle.left,
              top: particle.top,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        {/* Card Glow Effect */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-[#00b3e8] to-[#34c759] rounded-[24px] blur opacity-75"
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
            <div className="bg-gradient-to-r from-[#00b3e8] to-[#34c759] p-1 rounded-[20px] inline-block mb-4">
              <div className="bg-white px-6 py-3 rounded-[18px] flex items-center gap-2">
                <Sparkles className="text-[#00b3e8]" size={24} />
                <span className="font-['ABeeZee:Regular',sans-serif] text-[24px] bg-gradient-to-r from-[#00b3e8] to-[#34c759] bg-clip-text text-transparent">
                  SMOVE
                </span>
              </div>
            </div>
            <h1 className="font-['Medula_One:Regular',sans-serif] text-[28px] tracking-[2.8px] uppercase text-[#273a41] mb-2">
              Connexion
            </h1>
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px] text-[#9ba1a4]">
              Connectez-vous à votre compte (CMS pour les admins)
            </p>
          </motion.div>

          {/* Access Notice */}
          <motion.div
            className="bg-[#00b3e8]/10 border border-[#00b3e8]/20 rounded-[12px] p-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px] text-[#00b3e8] mb-1">
              Accès CMS interne
            </p>
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px] text-[#273a41]">
              Utilisez un compte administrateur autorisé pour accéder au tableau de bord.
            </p>
            {!cmsEnabled && (
              <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px] text-red-600 mt-2">
                CMS non disponible en production sans backend d'authentification sécurisé.
              </p>
            )}
          </motion.div>

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
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#00b3e8] outline-none transition-colors font-['Abhaya_Libre:Regular',sans-serif] text-[16px]"
                  placeholder="votre@email.com"
                  disabled={loading || !cmsEnabled}
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
                  className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#00b3e8] outline-none transition-colors font-['Abhaya_Libre:Regular',sans-serif] text-[16px]"
                  placeholder="••••••••"
                  disabled={loading || !cmsEnabled}
                />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00b3e8] to-[#00c0e8] text-white px-8 py-4 rounded-[12px] font-['Abhaya_Libre:Bold',sans-serif] text-[18px] flex items-center justify-center gap-2 relative overflow-hidden"
                disabled={loading || !cmsEnabled}
                translate="no"
              >
                {loading && (
                  <motion.span
                    className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                )}
                <LogIn size={20} className={loading ? 'opacity-70' : ''} />
                <span>{loading ? 'Connexion...' : 'Se connecter'}</span>
              </button>
            </motion.div>
          </form>

          {hasSocialLogin && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {showGoogleLogin && (
                <button
                  type="button"
                  disabled={loading || oauthLoadingProvider !== null}
                  onClick={() => void handleOAuth('google')}
                  className="px-4 py-3 rounded-[12px] border border-[#eef3f5] disabled:opacity-50"
                >
                  {oauthLoadingProvider === 'google' ? 'Redirection vers Google...' : 'Continuer avec Google'}
                </button>
              )}
              {showFacebookLogin && (
                <button
                  type="button"
                  disabled={loading || oauthLoadingProvider !== null}
                  onClick={() => void handleOAuth('facebook')}
                  className="px-4 py-3 rounded-[12px] border border-[#eef3f5] disabled:opacity-50"
                >
                  {oauthLoadingProvider === 'facebook' ? 'Redirection vers Facebook...' : 'Continuer avec Facebook'}
                </button>
              )}
            </div>
          )}

          {/* Footer Links */}
          <motion.div
            className="mt-8 text-center space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#9ba1a4]">
              <a href="#forgot-password" className="text-[#00b3e8] font-['Abhaya_Libre:Bold',sans-serif] hover:underline">
                Mot de passe oublié ?
              </a>
            </p>
            {registrationEnabled && (
              <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#9ba1a4]">
                Pas encore de compte?{' '}
                <a
                  href="#register"
                  className="text-[#34c759] font-['Abhaya_Libre:Bold',sans-serif] hover:underline"
                >
                  Créer un compte
                </a>
              </p>
            )}
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
