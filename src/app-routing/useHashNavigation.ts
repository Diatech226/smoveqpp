import { useEffect, useRef, useState } from 'react';
import type { AuthRoutingState, ResolvedPage } from './navigationTypes';
import { resolveRoute } from './routeResolver';

interface HashNavigationState {
  currentPage: ResolvedPage;
}

export function useHashNavigation(auth: AuthRoutingState): HashNavigationState {
  const [currentPage, setCurrentPage] = useState<ResolvedPage>('home');
  const pendingSectionScroll = useRef<string | null>(null);

  useEffect(() => {
    const syncFromHash = () => {
      const resolution = resolveRoute(window.location.hash, auth);
      setCurrentPage(resolution.page);

      if (resolution.normalizedHash && window.location.hash !== `#${resolution.normalizedHash}`) {
        window.location.hash = resolution.normalizedHash;
        return;
      }

      if (resolution.sectionToScroll) {
        pendingSectionScroll.current = resolution.sectionToScroll;
      }
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);

    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [auth]);

  useEffect(() => {
    if (pendingSectionScroll.current) {
      const sectionId = pendingSectionScroll.current;
      pendingSectionScroll.current = null;

      requestAnimationFrame(() => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      return;
    }

    window.scrollTo(0, 0);
  }, [currentPage]);

  return { currentPage };
}
