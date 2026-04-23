import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import AppPageRenderer from './AppPageRenderer';

vi.mock('../../components/services/ServiceDetailPage', () => ({
  default: ({ slug }: { slug: string }) => <div data-testid="service-detail">{slug}</div>,
}));

vi.mock('../../features/app-shell/PublicSiteShell', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../features/app-shell/SectionErrorBoundary', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../components/Navigation', () => ({ default: () => <div /> }));
vi.mock('../../components/Footer', () => ({ default: () => <div /> }));
vi.mock('../../components/PortfolioPage', () => ({ default: () => <div /> }));
vi.mock('../../components/BlogPageEnhanced', () => ({ default: () => <div /> }));
vi.mock('../../components/BlogDetailPage', () => ({ default: () => <div /> }));
vi.mock('../../components/ServicesHubPage', () => ({ default: () => <div /> }));
vi.mock('../../components/ProjectsPage', () => ({ default: () => <div /> }));
vi.mock('../../components/ProjectDetailPage', () => ({ default: () => <div /> }));
vi.mock('../../components/ContactPage', () => ({ default: () => <div /> }));
vi.mock('../../components/auth/LoginPage', () => ({ default: () => <div /> }));
vi.mock('../../components/auth/RegisterPage', () => ({ default: () => <div /> }));
vi.mock('../../components/auth/ForgotPasswordPage', () => ({ default: () => <div /> }));
vi.mock('../../components/auth/ResetPasswordPage', () => ({ default: () => <div /> }));
vi.mock('../../components/auth/AccountPage', () => ({ default: () => <div /> }));
vi.mock('../../imports/APropos', () => ({ default: () => <div /> }));
vi.mock('../marketing/home/HomePageContent', () => ({ default: () => <div /> }));
vi.mock('./SecurityStatePage', () => ({ default: () => <div /> }));
vi.mock('./AppStatusState', () => ({ AppLoadingState: () => <div /> }));



describe('AppPageRenderer premium service routes', () => {
  it('renders dynamic service detail for design-branding route', () => {
    render(<AppPageRenderer currentPage="service-design" cmsEnabled />);
    expect(screen.getByTestId('service-detail').textContent).toBe('design-branding');
  });

  it('renders dynamic service detail for web-development route', () => {
    render(<AppPageRenderer currentPage="service-web" cmsEnabled />);
    expect(screen.getByTestId('service-detail').textContent).toBe('web-development');
  });
});
