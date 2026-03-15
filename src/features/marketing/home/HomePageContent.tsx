import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Calendar, User } from 'lucide-react';
import Hero3DEnhanced from '../../../components/Hero3DEnhanced';
import Footer from '../../../components/Footer';
import ProjectsSection from '../../../components/ProjectsSection';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { pageContentRepository } from '../../../repositories/pageContentRepository';
import { resolveBlogMediaReference } from '../../blog/mediaReference';
import { serviceRepository } from '../../../repositories/serviceRepository';
import { toRenderableService } from '../serviceCatalog';
import { fetchPublicServices } from '../../../utils/publicContentApi';

const blogPosts = [
  {
    id: '1',
    title: 'Les tendances du design web en 2024',
    excerpt:
      'Découvrez les dernières tendances qui façonnent le paysage du design web moderne et comment les intégrer dans vos projets.',
    image: 'modern web design trends 2024',
    category: 'Design',
    author: 'Marie Kouassi',
    date: '15 Jan 2024',
  },
  {
    id: '2',
    title: "L'importance du SEO pour votre entreprise",
    excerpt:
      'Comment optimiser votre présence en ligne et améliorer votre visibilité sur les moteurs de recherche.',
    image: 'seo optimization business growth',
    category: 'Marketing',
    author: 'Jean Baptiste',
    date: '12 Jan 2024',
  },
  {
    id: '3',
    title: 'Créer une identité de marque forte',
    excerpt:
      'Les éléments essentiels pour construire une marque mémorable et cohérente qui résonne avec votre audience.',
    image: 'brand identity design process',
    category: 'Branding',
    author: 'Aïcha Traoré',
    date: '10 Jan 2024',
  },
];

function HomePageContent() {
  const homeContent = useMemo(() => pageContentRepository.getHomePageContent(), []);
  const aboutMedia = resolveBlogMediaReference(homeContent.aboutImage, 'SMOVE Team');
  const [servicesData, setServicesData] = useState(() => serviceRepository.getPublished().map(toRenderableService));

  useEffect(() => {
    let active = true;
    void fetchPublicServices().then((remote) => {
      if (!active || !remote) return;
      const synced = serviceRepository.replaceAll(remote);
      setServicesData(synced.filter((service) => service.status !== 'draft' && service.status !== 'archived').map(toRenderableService));
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="relative" style={{ position: 'relative' }}>
      {/* Hero Section with 3D Effect */}
      <Hero3DEnhanced
        badgeLabel={homeContent.heroBadge}
        titleLine1={homeContent.heroTitleLine1}
        titleLine2={homeContent.heroTitleLine2}
        description={homeContent.heroDescription}
        primaryCtaLabel={homeContent.heroPrimaryCtaLabel}
        secondaryCtaLabel={homeContent.heroSecondaryCtaLabel}
      />

      {/* Services Section */}
      <motion.section
        id="services"
        className="relative py-32 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-block bg-[#00b3e8]/10 text-[#00b3e8] px-6 py-3 rounded-full font-['Abhaya_Libre:Bold',sans-serif] text-[14px] mb-6"
              whileHover={{ scale: 1.05 }}
            >
              NOS SERVICES
            </motion.div>
            <h2 className="font-['ABeeZee:Regular',sans-serif] text-[48px] md:text-[72px] text-[#273a41] mb-6">
              {homeContent.servicesIntroTitle}
            </h2>
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[20px] text-[#38484e] max-w-3xl mx-auto">
              {homeContent.servicesIntroSubtitle}
            </p>
          </motion.div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesData.map((service, index) => (
              <motion.div
                key={index}
                className="group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <motion.div
                  className="relative h-full bg-gradient-to-br from-[#f5f9fa] to-white p-8 rounded-[24px] border-2 border-transparent overflow-hidden cursor-pointer"
                  whileHover={{
                    y: -10,
                    borderColor: '#00b3e8',
                    boxShadow: '0 25px 50px rgba(0, 179, 232, 0.2)',
                  }}
                >
                  {/* Background Gradient on Hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    <motion.div
                      className={`w-20 h-20 rounded-[16px] bg-gradient-to-br ${service.color} flex items-center justify-center mb-6`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <service.icon className="text-white" size={36} />
                    </motion.div>

                    <h3 className="font-['Medula_One:Regular',sans-serif] text-[24px] tracking-[2.4px] uppercase text-[#273a41] group-hover:text-white transition-colors mb-4">
                      {service.title}
                    </h3>

                    <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px] text-[#38484e] group-hover:text-white/90 transition-colors mb-6 leading-relaxed">
                      {service.description}
                    </p>

                    <motion.div
                      className="flex items-center gap-2 text-[#00b3e8] group-hover:text-white font-['Abhaya_Libre:Bold',sans-serif] text-[16px]"
                      whileHover={{ x: 5 }}
                    >
                      En savoir plus
                      <ArrowRight size={20} />
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* View All Services Button */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <motion.a
              href="#services-all"
              className="inline-block bg-gradient-to-r from-[#00b3e8] to-[#00c0e8] text-white px-10 py-5 rounded-[20px] font-['Abhaya_Libre:Bold',sans-serif] text-[18px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Voir tous nos services
            </motion.a>
          </motion.div>
        </div>
      </motion.section>

      {/* About Section */}
      <motion.section
        id="about"
        className="relative py-32 bg-gradient-to-b from-[#f5f9fa] to-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <motion.div
                className="aspect-square rounded-[24px] overflow-hidden shadow-2xl"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <ImageWithFallback
                  src={aboutMedia.isMediaAsset ? aboutMedia.src : ""}
                  alt="SMOVE Team"
                  query={aboutMedia.src}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Floating Stats */}
              <motion.div
                className="absolute -bottom-8 -right-8 bg-white p-6 rounded-[16px] shadow-xl"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, type: 'spring' }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="font-['ABeeZee:Regular',sans-serif] text-[48px] text-[#00b3e8]">5+</div>
                <div className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#9ba1a4]">Ans d'expérience</div>
              </motion.div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                className="inline-block bg-[#34c759]/10 text-[#34c759] px-6 py-3 rounded-full font-['Abhaya_Libre:Bold',sans-serif] text-[14px] mb-6"
                whileHover={{ scale: 1.05 }}
              >
                {homeContent.aboutBadge}
              </motion.div>

              <h2 className="font-['ABeeZee:Regular',sans-serif] text-[48px] md:text-[64px] text-[#273a41] mb-6 leading-tight">
                {homeContent.aboutTitle}
              </h2>

              <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[18px] text-[#38484e] mb-6 leading-relaxed">
                {homeContent.aboutParagraphOne}
              </p>

              <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[18px] text-[#38484e] mb-8 leading-relaxed">
                {homeContent.aboutParagraphTwo}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mb-8">
                {[
                  { value: '150+', label: 'Projets' },
                  { value: '50+', label: 'Clients' },
                  { value: '100%', label: 'Satisfaction' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <div className="font-['ABeeZee:Regular',sans-serif] text-[36px] text-[#00b3e8]">
                      {stat.value}
                    </div>
                    <div className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#9ba1a4]">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.a
                href="#portfolio"
                className="inline-flex items-center gap-2 bg-[#34c759] text-white px-8 py-4 rounded-[15px] font-['Abhaya_Libre:Bold',sans-serif] text-[16px]"
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                Découvrir notre équipe
                <ArrowRight size={20} />
              </motion.a>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Portfolio/Projects Section */}
      <motion.section
        id="portfolio"
        className="relative py-32 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-block bg-[#ffc247]/10 text-[#ffc247] px-6 py-3 rounded-full font-['Abhaya_Libre:Bold',sans-serif] text-[14px] mb-6"
              whileHover={{ scale: 1.05 }}
            >
              PORTFOLIO
            </motion.div>
            <h2 className="font-['ABeeZee:Regular',sans-serif] text-[48px] md:text-[72px] text-[#273a41] mb-6">
              Nos derniers projets
            </h2>
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[20px] text-[#38484e] max-w-3xl mx-auto">
              Découvrez comment nous avons aidé nos clients à atteindre leurs objectifs
            </p>
          </motion.div>

          <ProjectsSection />

          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.a
              href="#projects"
              className="inline-block bg-gradient-to-r from-[#ffc247] to-[#ff9f47] text-white px-10 py-5 rounded-[20px] font-['Abhaya_Libre:Bold',sans-serif] text-[18px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Voir tous nos projets
            </motion.a>
          </motion.div>
        </div>
      </motion.section>

      {/* Blog Section */}
      <motion.section
        id="blog"
        className="relative py-32 bg-gradient-to-b from-[#f5f9fa] to-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-block bg-[#a855f7]/10 text-[#a855f7] px-6 py-3 rounded-full font-['Abhaya_Libre:Bold',sans-serif] text-[14px] mb-6"
              whileHover={{ scale: 1.05 }}
            >
              BLOG
            </motion.div>
            <h2 className="font-['ABeeZee:Regular',sans-serif] text-[48px] md:text-[72px] text-[#273a41] mb-6">
              Derniers articles
            </h2>
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[20px] text-[#38484e] max-w-3xl mx-auto">
              Actualités, conseils et insights sur le digital
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.id}
                className="bg-white rounded-[24px] overflow-hidden shadow-lg group cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  y: -10,
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="aspect-video overflow-hidden">
                  <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.6 }}>
                    <ImageWithFallback
                      src={aboutMedia.isMediaAsset ? aboutMedia.src : ""}
                      alt={post.title}
                      query={post.image}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>

                <div className="p-6">
                  <span className="inline-block bg-[#00b3e8]/10 text-[#00b3e8] px-3 py-1 rounded-full font-['Abhaya_Libre:Bold',sans-serif] text-[12px] mb-4">
                    {post.category}
                  </span>

                  <h3 className="font-['Abhaya_Libre:Bold',sans-serif] text-[20px] text-[#273a41] mb-3 line-clamp-2 group-hover:text-[#00b3e8] transition-colors">
                    {post.title}
                  </h3>

                  <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#38484e] mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-[#eef3f5]">
                    <div className="flex items-center gap-2 text-[#9ba1a4]">
                      <User size={16} />
                      <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px]">
                        {post.author}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#9ba1a4]">
                      <Calendar size={16} />
                      <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px]">
                        {post.date}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.a
              href="#blog"
              className="inline-block bg-gradient-to-r from-[#a855f7] to-[#9333ea] text-white px-10 py-5 rounded-[20px] font-['Abhaya_Libre:Bold',sans-serif] text-[18px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Voir tous les articles
            </motion.a>
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        id="contact"
        className="relative py-32 bg-gradient-to-br from-[#00b3e8] to-[#00c0e8]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated Background */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `${10 + i * 10}%`,
              top: `${20 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-['ABeeZee:Regular',sans-serif] text-[48px] md:text-[72px] text-white mb-6">
              Travaillons ensemble
            </h2>
            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[20px] text-white/90 max-w-2xl mx-auto">
              Vous avez un projet en tête ? Contactez-nous et discutons de la manière dont nous pouvons vous aider à le réaliser.
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-[24px] p-8 md:p-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-['Abhaya_Libre:Bold',sans-serif] text-[16px] text-[#273a41] mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#00b3e8] outline-none transition-colors font-['Abhaya_Libre:Regular',sans-serif] text-[16px]"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="block font-['Abhaya_Libre:Bold',sans-serif] text-[16px] text-[#273a41] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#00b3e8] outline-none transition-colors font-['Abhaya_Libre:Regular',sans-serif] text-[16px]"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block font-['Abhaya_Libre:Bold',sans-serif] text-[16px] text-[#273a41] mb-2">
                  Sujet
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#00b3e8] outline-none transition-colors font-['Abhaya_Libre:Regular',sans-serif] text-[16px]"
                  placeholder="Comment pouvons-nous vous aider ?"
                />
              </div>

              <div>
                <label className="block font-['Abhaya_Libre:Bold',sans-serif] text-[16px] text-[#273a41] mb-2">
                  Message
                </label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 rounded-[12px] border-2 border-[#eef3f5] focus:border-[#00b3e8] outline-none transition-colors font-['Abhaya_Libre:Regular',sans-serif] text-[16px] resize-none"
                  placeholder="Décrivez votre projet..."
                />
              </div>

              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00b3e8] to-[#00c0e8] text-white px-8 py-5 rounded-[15px] font-['Abhaya_Libre:Bold',sans-serif] text-[18px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Envoyer le message
              </motion.button>
            </form>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default HomePageContent;
