import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: unknown }) => children,
  useAuth: () => ({
    isAuthenticated: false,
    isAuthReady: true,
    canAccessCMS: false,
    cmsEnabled: true,
    registrationEnabled: true,
    postLoginRoute: 'account',
  }),
}));

vi.mock('./app-routing/useHashNavigation', () => ({
  useHashNavigation: () => ({ currentPage: 'home' }),
}));

vi.mock('./features/app-shell/AppPageRenderer', () => ({
  default: () => <div data-app-page-renderer="ready">site ready</div>,
}));

vi.mock('./utils/contentApi', () => ({
  fetchPublicSettings: async () => ({
    siteSettings: {
      siteTitle: 'Site',
      brandMedia: { defaultSocialImage: '', favicon: '' },
    },
  }),
}));

vi.mock('./features/marketing/pageMetadata', () => ({
  applyResolvedPageMetadata: () => undefined,
  configurePublicMetadata: () => undefined,
}));

vi.mock('./utils/analytics', () => ({
  trackSiteEvent: () => undefined,
}));

vi.mock('motion/react', () => ({
  motion: {
    button: ({ children, ...props }: Record<string, unknown>) => <button {...props}>{children}</button>,
  },
}));

import App from './App';

describe('App boot render', () => {
  it('renders site shell without crashing', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('data-app-page-renderer="ready"');
    expect(html).toContain('site ready');
  });
});
