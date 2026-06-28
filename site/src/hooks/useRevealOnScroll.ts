import { RefObject, useEffect } from 'react';

const VISIBLE_CLASS = 'is-visible';

export function useRevealOnScroll<T extends HTMLElement>(ref: RefObject<T>, options?: IntersectionObserverInit) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      element.classList.add(VISIBLE_CLASS);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add(VISIBLE_CLASS);
          observer.unobserve(element);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12, ...options },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);
}
