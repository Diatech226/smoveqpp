import { motion } from 'motion/react';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useHashNavigation } from './app-routing/useHashNavigation';
import AppErrorBoundary from './features/app-shell/AppErrorBoundary';
import AppPageRenderer from './features/app-shell/AppPageRenderer';
import { bootstrapPublicBranding } from './utils/publicBranding';
import { resolveMediaUrl } from './utils/mediaResolver';
import { mediaRepository } from './repositories/mediaRepository';
import { logDebug } from './utils/observability';
import { applyResolvedPageMetadata, configurePublicMetadata } from './features/marketing/pageMetadata';
import { trackSiteEvent } from './utils/analytics';

function AppContent() {
  const {
    isAuthenticated,
    isAuthReady,
    canAccessCMS,
    cmsEnabled,
    registrationEnabled,
    postLoginRoute,
  } = useAuth();
  const { currentPage } = useHashNavigation({
    isAuthenticated,
    isAuthReady,
    canAccessCMS,
    cmsEnabled,
    registrationEnabled,
    postLoginRoute,
  });

  const shouldHideScrollToTop =
    ['login', 'register', 'forgot-password', 'reset-password', 'auth-loading', 'cms-unavailable', 'cms-forbidden'].includes(currentPage) ||
    currentPage.startsWith('cms-');

  useEffect(() => {
    let active = true;
    void bootstrapPublicBranding()
      .then(({ settings }) => {
        if (!active) return;
        configurePublicMetadata({
          siteTitle: settings.siteSettings.siteTitle.trim(),
          defaultSocialImage: resolveMediaUrl(settings.siteSettings.brandMedia.defaultSocialImage, mediaRepository.getAll()),
        });
        const faviconHref = resolveMediaUrl(settings.siteSettings.brandMedia.favicon, mediaRepository.getAll());
        if (faviconHref) {
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
          if (link) {
            link.href = faviconHref;
          }
        }


      })
      .catch((error) => {
        logDebug({ scope: 'branding', event: 'startup_failed', error });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    applyResolvedPageMetadata(currentPage);
    trackSiteEvent({
      name: 'route_viewed',
      route: currentPage,
    });
  }, [currentPage]);

  return (
    <div className="min-h-screen">
      <AppPageRenderer
        currentPage={currentPage}
        cmsEnabled={cmsEnabled}
      />

      {!shouldHideScrollToTop && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 bg-[#00b3e8] text-white p-4 rounded-full shadow-lg z-50"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1, backgroundColor: '#00c0e8' }}
          whileTap={{ scale: 0.9 }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppErrorBoundary>
  );
}
