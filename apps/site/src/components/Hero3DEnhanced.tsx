import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type FocusEvent, type MouseEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import type { HomePageContentSettings } from '../data/pageContentSeed';
import {
  nextHeroBackgroundIndex,
  normalizeHeroBackgroundIntervalMs,
  previousHeroBackgroundIndex,
  resolveHeroBackgroundItems,
  shouldAutoplayHeroBackground,
} from '../features/marketing/home/heroBackground';
import { CONTACT_CTA_HREF } from '../features/marketing/navigationCta';

interface Hero3DEnhancedProps {
  badgeLabel?: string;
  titleLine1?: string;
  titleLine2?: string;
  description?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  backgroundItems?: HomePageContentSettings['heroBackgroundItems'];
  backgroundRotationEnabled?: boolean;
  backgroundAutoplay?: boolean;
  backgroundIntervalMs?: number;
  backgroundTransitionStyle?: HomePageContentSettings['heroBackgroundTransitionStyle'];
  backgroundOverlayOpacity?: number;
  enable3DEffects?: boolean;
  enableParallax?: boolean;
}

export default function Hero3DEnhanced({
  badgeLabel = 'Agence de communication',
  titleLine1 = 'Donnez du relief',
  titleLine2 = 'à votre communication',
  description =
    'Un hero premium avec animation 3D légère, pour valoriser votre image de marque et présenter vos services avec impact.',
  primaryCtaLabel = 'Découvrir nos services',
  primaryCtaHref = '#services',
  secondaryCtaLabel = 'Lancer un projet',
  secondaryCtaHref = CONTACT_CTA_HREF,
  backgroundItems = [],
  backgroundRotationEnabled = false,
  backgroundAutoplay = true,
  backgroundIntervalMs = 6000,
  backgroundTransitionStyle = 'fade',
  backgroundOverlayOpacity = 0.45,
  enable3DEffects = true,
  enableParallax = true,
}: Hero3DEnhancedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const smoothTiltX = useSpring(tiltX, { stiffness: 140, damping: 24 });
  const smoothTiltY = useSpring(tiltY, { stiffness: 140, damping: 24 });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.9, 0.65]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const [activeBackgroundIndex, setActiveBackgroundIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
  const [isInteractionPaused, setIsInteractionPaused] = useState(false);

  const resolvedBackgrounds = useMemo(() => resolveHeroBackgroundItems(backgroundItems), [backgroundItems]);
  const hasCmsMediaBackground = resolvedBackgrounds.length > 0;
  const safeActiveBackgroundIndex = resolvedBackgrounds.length > 0 ? activeBackgroundIndex % resolvedBackgrounds.length : 0;
  const canAutoplay = shouldAutoplayHeroBackground(backgroundRotationEnabled, backgroundAutoplay, resolvedBackgrounds.length) && !isInteractionPaused;
  const rotationIntervalMs = normalizeHeroBackgroundIntervalMs(backgroundIntervalMs);
  const activeBackground = hasCmsMediaBackground ? resolvedBackgrounds[safeActiveBackgroundIndex] : null;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !enable3DEffects) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      tiltY.set(x * 12);
      tiltX.set(-y * 10);
    };

    const resetTilt = () => {
      tiltX.set(0);
      tiltY.set(0);
    };

    stage.addEventListener('pointermove', handlePointerMove);
    stage.addEventListener('pointerleave', resetTilt);

    return () => {
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerleave', resetTilt);
    };
  }, [enable3DEffects, tiltX, tiltY]);

  useEffect(() => {
    if (resolvedBackgrounds.length === 0) {
      setActiveBackgroundIndex(0);
      return;
    }
    setActiveBackgroundIndex((current) => current % resolvedBackgrounds.length);
  }, [resolvedBackgrounds.length]);

  useEffect(() => {
    if (!canAutoplay) return;
    const interval = window.setInterval(() => {
      setActiveBackgroundIndex((current) => nextHeroBackgroundIndex(current, resolvedBackgrounds.length));
    }, rotationIntervalMs);
    return () => window.clearInterval(interval);
  }, [canAutoplay, resolvedBackgrounds.length, rotationIntervalMs]);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCtaClick = (event: MouseEvent<HTMLAnchorElement>, href: string, fallbackSection: string) => {
    if (!href.startsWith('#') || href.startsWith('#/')) return;
    event.preventDefault();
    const sectionId = href.slice(1).trim();
    scrollToSection(sectionId || fallbackSection);
  };

  const goToPreviousBackground = () => {
    if (resolvedBackgrounds.length <= 1) return;
    setActiveBackgroundIndex((current) => previousHeroBackgroundIndex(current, resolvedBackgrounds.length));
  };

  const goToNextBackground = () => {
    if (resolvedBackgrounds.length <= 1) return;
    setActiveBackgroundIndex((current) => nextHeroBackgroundIndex(current, resolvedBackgrounds.length));
  };

  const getResolvedBackgroundImage = (index: number) => {
    const background = resolvedBackgrounds[index];
    if (!background) return '';
    if (viewportWidth < 768) return background.mobileSrc || background.tabletSrc || background.desktopSrc;
    if (viewportWidth < 1024) return background.tabletSrc || background.desktopSrc;
    return background.desktopSrc;
  };

  const handleControlsFocus = (_event: FocusEvent<HTMLElement>) => {
    setIsInteractionPaused(true);
  };

  const handleControlsBlur = (_event: FocusEvent<HTMLElement>) => {
    setIsInteractionPaused(false);
  };

  return (
    <motion.section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0d1f2d] via-[#1a2f3d] to-[#0d1f2d] pt-32 pb-20"
      style={{ opacity: heroOpacity }}
    >
      {hasCmsMediaBackground ? (
        <div
          className="absolute inset-0 z-0"
          onMouseEnter={() => setIsInteractionPaused(true)}
          onMouseLeave={() => setIsInteractionPaused(false)}
        >
          {resolvedBackgrounds.map((background, index) => {
            const resolvedBackgroundImage = getResolvedBackgroundImage(index);
            const isActive = index === safeActiveBackgroundIndex;
            return (
              <motion.div
                key={background.id}
                className="absolute inset-0"
                initial={false}
                animate={backgroundTransitionStyle === 'slide'
                  ? { opacity: isActive ? 1 : 0, x: isActive ? 0 : index < safeActiveBackgroundIndex ? -72 : 72, scale: isActive ? 1 : 1.02 }
                  : { opacity: isActive ? 1 : 0, scale: isActive ? 1 : 1.015 }}
                transition={{ duration: backgroundTransitionStyle === 'slide' ? 0.8 : 1.05, ease: 'easeOut' }}
                style={{ zIndex: isActive ? 2 : 1, pointerEvents: isActive ? 'auto' : 'none' }}
                aria-hidden={!isActive}
              >
                {background.type === 'video' && background.videoSrc ? (
                  <video
                    src={background.videoSrc}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: background.position }}
                    autoPlay
                    muted
                    playsInline
                    loop
                    preload="metadata"
                  />
                ) : null}
                <div
                  aria-label={background.alt || 'Hero background'}
                  role="img"
                  className="h-full w-full"
                  style={{
                    backgroundImage: resolvedBackgroundImage ? `url("${resolvedBackgroundImage}")` : 'none',
                    backgroundSize: background.size,
                    backgroundPosition: background.position,
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    opacity: Math.min(0.85, Math.max(0.15, background.overlayOpacity || backgroundOverlayOpacity)),
                    background: `linear-gradient(180deg, ${background.overlayColor || '#04111f'}CC 0%, ${background.overlayColor || '#04111f'}99 50%, ${background.overlayColor || '#04111f'}CC 100%)`,
                  }}
                />
                {isActive && (background.title || background.description) ? (
                  <div className="pointer-events-none absolute bottom-6 left-6 right-6 z-10 rounded-[14px] border border-white/20 bg-black/35 p-4 text-white backdrop-blur-sm">
                    {background.title ? <p className="text-[18px] font-semibold">{background.title}</p> : null}
                    {background.description ? <p className="mt-1 text-[14px] text-white/85">{background.description}</p> : null}
                    {background.ctaLabel && background.ctaHref ? (
                      <a
                        href={background.ctaHref}
                        className="pointer-events-auto mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/20"
                        onClick={(event) => handleCtaClick(event, background.ctaHref, 'services')}
                      >
                        {background.ctaLabel}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </motion.div>
            );
          })}
          {resolvedBackgrounds.length > 1 ? (
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-2 py-2 backdrop-blur-md" onFocus={handleControlsFocus} onBlur={handleControlsBlur}>
              <span className="px-2 text-[11px] font-semibold tracking-[0.08em] text-white/75">
                {safeActiveBackgroundIndex + 1}/{resolvedBackgrounds.length}
              </span>
              <button type="button" aria-label="Diapositive précédente" className="rounded-full border border-white/30 bg-black/30 p-2 text-white transition hover:bg-black/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={goToPreviousBackground}>
                <ArrowLeft size={18} />
              </button>
              <button type="button" aria-label="Diapositive suivante" className="rounded-full border border-white/30 bg-black/30 p-2 text-white transition hover:bg-black/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={goToNextBackground}>
                <ArrowRight size={18} />
              </button>
            </div>
          ) : null}
          {resolvedBackgrounds.length > 1 ? (
            <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2" onFocus={handleControlsFocus} onBlur={handleControlsBlur}>
              {resolvedBackgrounds.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Aller à la diapositive ${index + 1}`}
                  aria-pressed={index === safeActiveBackgroundIndex}
                  aria-current={index === safeActiveBackgroundIndex}
                  className={`h-2.5 w-2.5 rounded-full transition ${index === safeActiveBackgroundIndex ? 'bg-white ring-2 ring-white/60' : 'bg-white/45 hover:bg-white/70'}`}
                  onClick={() => setActiveBackgroundIndex(index)}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <motion.div className="absolute inset-0" style={{ y: enableParallax && (activeBackground?.enableParallax ?? true) ? backgroundY : 0 }}>
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 179, 232, 0.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 179, 232, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
          animate={{ backgroundPosition: ['0px 0px', '64px 64px'] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />

        <motion.div
          className="absolute left-20 top-20 w-64 h-64 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0, 179, 232, 0.28), rgba(0, 179, 232, 0))',
          }}
          animate={{ y: [0, -30, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute right-20 bottom-20 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(52, 199, 89, 0.24), rgba(52, 199, 89, 0))',
          }}
          animate={{ y: [0, 24, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </motion.div>

      <div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent"
        style={{ opacity: hasCmsMediaBackground ? Math.min(0.9, Math.max(0.2, backgroundOverlayOpacity + 0.2)) : 1 }}
      />

      <motion.div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ y: enableParallax ? heroY : 0 }}>
        <div className="text-center">
          <motion.div
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-full px-6 py-3 mb-8"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Sparkles className="text-[#00b3e8]" size={18} />
            <span className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px] text-white tracking-[1.6px] uppercase">{badgeLabel}</span>
          </motion.div>

          <motion.h1
            className="font-['ABeeZee:Regular',sans-serif] text-[48px] md:text-[96px] leading-none text-white mb-6"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            {titleLine1}
            <span className="block bg-gradient-to-r from-[#00b3e8] via-white to-[#34c759] bg-clip-text text-transparent">{titleLine2}</span>
          </motion.h1>

          <motion.p
            className="font-['Abhaya_Libre:Regular',sans-serif] text-[20px] text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {description}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.a
              href={primaryCtaHref}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00b3e8] to-[#00c0e8] text-white px-8 py-4 rounded-[16px] font-['Abhaya_Libre:Bold',sans-serif] text-[18px]"
              whileHover={{ scale: 1.04, boxShadow: '0 20px 50px rgba(0, 179, 232, 0.35)' }}
              whileTap={{ scale: 0.96 }}
              onClick={(event) => {
                handleCtaClick(event, primaryCtaHref, 'services');
              }}
            >
              {primaryCtaLabel}
              <ArrowRight size={20} />
            </motion.a>

            <motion.a
              href={secondaryCtaHref}
              className="inline-flex items-center gap-2 bg-white/10 border-2 border-white/30 text-white px-8 py-4 rounded-[16px] font-['Abhaya_Libre:Bold',sans-serif] text-[18px] backdrop-blur-md"
              whileHover={{ scale: 1.04, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              whileTap={{ scale: 0.96 }}
              onClick={(event) => {
                handleCtaClick(event, secondaryCtaHref, 'contact');
              }}
            >
              {secondaryCtaLabel}
            </motion.a>
          </motion.div>
        </div>

        <motion.div
          ref={stageRef}
          className="relative h-[500px] w-full flex items-center justify-center cursor-pointer"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
        >
          <div className="relative w-full h-[500px] flex items-center justify-center" style={{ perspective: 1200 }}>
            <motion.div className="relative h-[324px] w-[600px]" style={{ rotateX: enable3DEffects ? smoothTiltX : 0, rotateY: enable3DEffects ? smoothTiltY : 0, transformStyle: 'preserve-3d' }}>
              <motion.div
                className="absolute inset-0 rounded-[24px] bg-white/10 border border-white/20 backdrop-blur-md shadow-2xl p-8"
                style={{ transform: 'translateZ(40px)' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="size-[12px] rounded-full bg-[#ff5f56]" />
                    <span className="size-[12px] rounded-full bg-[#ffbd2e]" />
                    <span className="size-[12px] rounded-full bg-[#27c93f]" />
                  </div>
                  <span className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px] text-white/70">Campagne 360°</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-8">{[42, 78, 62].map((value, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-[12px] p-4">
                    <div className="font-['ABeeZee:Regular',sans-serif] text-[28px] text-white mb-1">{value}%</div>
                    <div className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px] text-white/65">Performance</div>
                    <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-[#00b3e8] to-[#34c759]" initial={{ width: '0%' }} animate={{ width: `${value}%` }} transition={{ duration: 1.2, delay: 0.5 + index * 0.2 }} />
                    </div>
                  </div>
                ))}</div>
                <div className="space-y-3">{[90, 72, 58].map((line, index) => (
                  <div key={index} className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-[#00b3e8]/5 to-[#2da84a]/10 rounded-full" initial={{ width: '0%' }} animate={{ width: `${line}%` }} transition={{ duration: 1, delay: 0.9 + index * 0.15 }} />
                  </div>
                ))}</div>
              </motion.div>
              <motion.div className="hidden md:block absolute top-4 -right-20 w-[280px] bg-white/10 border border-white/20 rounded-[16px] backdrop-blur-sm p-4" style={{ transform: 'translateZ(120px)' }} animate={{ y: [0, -12, 0], rotate: [-4, -2, -4] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
                <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px] text-[#00b3e8] mb-2">Brand Content</p>
                <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-white/80">Storytelling, visuels et activation social media.</p>
              </motion.div>
              <motion.div className="hidden md:block absolute -left-8 bottom-8 w-[280px] bg-white/10 border border-white/20 rounded-[16px] backdrop-blur-sm p-4" style={{ transform: 'translateZ(100px)' }} animate={{ y: [0, 10, 0], rotate: [3, 1, 3] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}>
                <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px] text-[#34c759] mb-2">Web & Performance</p>
                <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-white/80">Site vitrine, tunnel de conversion et suivi KPI.</p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div className="flex flex-col items-center gap-2 text-white/50" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.8 }} onClick={() => scrollToSection('services')}>
          <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px]">Scroll pour découvrir</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
            <ArrowDown size={22} />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
