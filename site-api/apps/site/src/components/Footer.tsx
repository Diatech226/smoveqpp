import { useEffect, useState } from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { fetchPublicSettings } from '../utils/contentApi';
import imgTelegramCloudDocument from "figma:asset/9152e642280f0d22dbf10b789d9b260fdd8949da.png";
import { PUBLIC_ROUTE_HASH } from '../features/marketing/publicRoutes';
import { submitNewsletterSubscription } from '../utils/newsletterApi';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [siteTitle, setSiteTitle] = useState('SMOVE');
  const [supportEmail, setSupportEmail] = useState('contact@smove-communication.com');
  const [logoSrc, setLogoSrc] = useState(imgTelegramCloudDocument);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterFeedback, setNewsletterFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    void fetchPublicSettings()
      .then((settings) => {
        if (!active) return;
        if (settings.siteSettings.siteTitle.trim()) setSiteTitle(settings.siteSettings.siteTitle.trim());
        if (settings.siteSettings.supportEmail.trim()) setSupportEmail(settings.siteSettings.supportEmail.trim());
        if (settings.siteSettings.brandMedia.logo.trim()) setLogoSrc(settings.siteSettings.brandMedia.logo.trim());
      })
      .catch(() => {
        // Keep static fallback copy when backend settings are unavailable.
      });

    return () => {
      active = false;
    };
  }, []);


  const onNewsletterSubmit = async () => {
    const email = newsletterEmail.trim();
    if (!email) {
      setNewsletterFeedback({ type: 'error', message: "Veuillez renseigner un email." });
      return;
    }

    setNewsletterSubmitting(true);
    setNewsletterFeedback(null);

    try {
      const result = await submitNewsletterSubscription(email, 'footer');
      if (!result.success) {
        setNewsletterFeedback({ type: 'error', message: result.message });
        return;
      }

      setNewsletterFeedback({ type: 'success', message: result.message });
      setNewsletterEmail('');
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#02033b] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* About Column */}
          <div>
            <h3 className="font-['Medula_One:Regular',sans-serif] text-[20px] tracking-[2px] uppercase text-[#00b3e8] mb-6">
              {siteTitle}
            </h3>
            <img src={logoSrc} alt={siteTitle} className="h-10 w-auto rounded-full mb-4" />
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] leading-[1.6] text-white/80 mb-6">
              Agence de communication digitale spécialisée dans la création de contenu, le développement web et la stratégie digitale.
            </p>
            <div className="flex gap-4">
              <span className="text-white/70">
                <Facebook size={20} />
              </span>
              <span className="text-white/70">
                <Twitter size={20} />
              </span>
              <span className="text-white/70">
                <Instagram size={20} />
              </span>
              <span className="text-white/70">
                <Linkedin size={20} />
              </span>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="font-['Medula_One:Regular',sans-serif] text-[16px] tracking-[1.6px] uppercase mb-6">
              Services
            </h3>
            <ul className="space-y-3 font-['Abhaya_Libre:Regular',sans-serif] text-[14px]">
              <li><a href="#services" className="hover:text-[#00b3e8] transition-colors">Design & Branding</a></li>
              <li><a href="#services" className="hover:text-[#00b3e8] transition-colors">Développement Web</a></li>
              <li><a href="#services" className="hover:text-[#00b3e8] transition-colors">Communication Digitale</a></li>
              <li><a href="#services" className="hover:text-[#00b3e8] transition-colors">Production Vidéo</a></li>
              <li><a href="#services" className="hover:text-[#00b3e8] transition-colors">Création 3D</a></li>
            </ul>
          </div>

          {/* Links Column */}
          <div>
            <h3 className="font-['Medula_One:Regular',sans-serif] text-[16px] tracking-[1.6px] uppercase mb-6">
              Liens Rapides
            </h3>
            <ul className="space-y-3 font-['Abhaya_Libre:Regular',sans-serif] text-[14px]">
              <li><a href={PUBLIC_ROUTE_HASH.home} className="hover:text-[#00b3e8] transition-colors">Accueil</a></li>
              <li><a href="#about" className="hover:text-[#00b3e8] transition-colors">À Propos</a></li>
              <li><a href="#portfolio" className="hover:text-[#00b3e8] transition-colors">Portfolio</a></li>
              <li><a href={PUBLIC_ROUTE_HASH.blog} className="hover:text-[#00b3e8] transition-colors">Blog</a></li>
              <li><a href={PUBLIC_ROUTE_HASH.contact} className="hover:text-[#00b3e8] transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="font-['Medula_One:Regular',sans-serif] text-[16px] tracking-[1.6px] uppercase mb-6">
              Contact
            </h3>
            <ul className="space-y-4 font-['Abhaya_Libre:Regular',sans-serif] text-[14px]">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-[#00b3e8] mt-1 flex-shrink-0" />
                <span>Abidjan, Côte d'Ivoire</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={20} className="text-[#00b3e8] flex-shrink-0" />
                <span>+225 XX XX XX XX XX</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={20} className="text-[#00b3e8] flex-shrink-0" />
                <span>{supportEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-[#ffc247] rounded-[42px] p-8 mb-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-['Inter:Extra_Bold',sans-serif] text-[23px] text-[#02033b] mb-4">
              Abonnez-vous à la Newsletter
            </h3>
            <p className="font-['Inter:Regular',sans-serif] text-[15px] text-[#02033b] mb-6">
              Ne manquez rien de nos offres et informations
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="Votre email"
                className="flex-1 px-6 py-3 rounded-full text-[#02033b] placeholder:text-[#02033b]/50"
                aria-label="Email newsletter"
              />
              <button
                type="button"
                onClick={() => { void onNewsletterSubmit(); }}
                disabled={newsletterSubmitting}
                className="bg-[#02033b] text-white px-8 py-3 rounded-full font-['Inter:Extra_Bold',sans-serif] hover:bg-[#030424] transition-colors disabled:opacity-70"
              >
                {newsletterSubmitting ? 'Envoi...' : 'Souscrire'}
              </button>
            </div>
            {newsletterFeedback ? (
              <p className={`mt-3 text-[14px] ${newsletterFeedback.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {newsletterFeedback.message}
              </p>
            ) : null}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[13px] text-white/65">
            © {currentYear} {siteTitle} Communication. Tous droits réservés.
          </p>
          <div className="flex gap-6 font-['Abhaya_Libre:Regular',sans-serif] text-[13px] text-white/65">
            <span>Politique de Confidentialité</span>
            <span>Conditions d'Utilisation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
