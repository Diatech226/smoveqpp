import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import PortfolioPage from '../../components/PortfolioPage';
import BlogPageEnhanced from '../../components/BlogPageEnhanced';
import ServicesHubPage from '../../components/ServicesHubPage';
import DesignBrandingPage from '../../components/services/DesignBrandingPage';
import WebDevelopmentPage from '../../components/services/WebDevelopmentPage';
import ProjectsPage from '../../components/ProjectsPage';
import ProjectDetailPage from '../../components/ProjectDetailPage';
import LoginPage from '../../components/auth/LoginPage';
import RegisterPage from '../../components/auth/RegisterPage';
import AccountPage from '../../components/auth/AccountPage';
import CMSDashboard from '../../components/cms/CMSDashboard';
import CMSAppShell from '../../components/cms/CMSAppShell';
import APropos from '../../imports/APropos';
import HomePageContent from '../marketing/home/HomePageContent';
import type { ResolvedPage } from '../../app-routing/navigationTypes';
import SecurityStatePage from './SecurityStatePage';
import SectionErrorBoundary from './SectionErrorBoundary';
import PublicSiteShell from './PublicSiteShell';
import { AppLoadingState } from './AppStatusState';

interface AppPageRendererProps {
  currentPage: ResolvedPage;
  cmsSection: string;
  onCmsSectionChange: (section: string) => void;
  cmsEnabled: boolean;
}

export default function AppPageRenderer({
  currentPage,
  cmsSection,
  onCmsSectionChange,
  cmsEnabled
}: AppPageRendererProps) {
  if (currentPage === 'auth-loading') {
    return (
      <AppLoadingState
        title="Vérification de session"
        description="Validation de votre session en cours..."
        actionHref="#home"
        actionLabel="Retour à l'accueil"
      />
    );
  }

  if (currentPage === 'login') {
    if (!cmsEnabled) {
      return (
        <SecurityStatePage
          title="CMS désactivé"
          description="Le CMS est désactivé dans cet environnement tant qu'un backend d'authentification sécurisé n'est pas configuré."
          actionHref="#home"
          actionLabel="Retour à l'accueil"
        />
      );
    }
    return <LoginPage />;
  }

  if (currentPage === 'register') {
    if (!cmsEnabled) {
      return (
        <SecurityStatePage
          title="CMS désactivé"
          description="Le CMS est désactivé dans cet environnement tant qu'un backend d'authentification sécurisé n'est pas configuré."
          actionHref="#home"
          actionLabel="Retour à l'accueil"
        />
      );
    }
    return <RegisterPage />;
  }

  if (currentPage === 'account') {
    return <AccountPage />;
  }

  if (currentPage === 'cms-dashboard') {
    return (
      <CMSAppShell>
        <SectionErrorBoundary scope="cms-dashboard">
          <CMSDashboard currentSection={cmsSection} onSectionChange={onCmsSectionChange} />
        </SectionErrorBoundary>
      </CMSAppShell>
    );
  }

  if (currentPage === 'cms-unavailable') {
    return (
      <SecurityStatePage
        title="CMS désactivé"
        description="Le CMS est désactivé dans cet environnement tant qu'un backend d'authentification sécurisé n'est pas configuré."
        actionHref="#home"
        actionLabel="Retour à l'accueil"
      />
    );
  }

  if (currentPage === 'cms-forbidden') {
    return (
      <SecurityStatePage
        title="Accès refusé"
        description="Votre session est valide mais vous n'avez pas les droits administrateur requis."
        actionHref="#home"
        actionLabel="Retour à l'accueil"
      />
    );
  }

  if (currentPage.startsWith('project-')) {
    const projectId = currentPage.replace('project-', '');
    return (
      <PublicSiteShell>
        <SectionErrorBoundary scope="project-detail">
          <ProjectDetailPage projectId={projectId} />
        </SectionErrorBoundary>
      </PublicSiteShell>
    );
  }

  switch (currentPage) {
    case 'home':
      return (
        <PublicSiteShell>
          <SectionErrorBoundary scope="home">
            <>
              <Navigation currentPath="/" />
              <HomePageContent />
            </>
          </SectionErrorBoundary>
        </PublicSiteShell>
      );
    case 'projects':
      return (
        <PublicSiteShell>
          <SectionErrorBoundary scope="projects">
            <ProjectsPage />
          </SectionErrorBoundary>
        </PublicSiteShell>
      );
    case 'services-all':
      return (
        <PublicSiteShell>
          <SectionErrorBoundary scope="services">
            <ServicesHubPage />
          </SectionErrorBoundary>
        </PublicSiteShell>
      );
    case 'service-design':
      return (
        <PublicSiteShell>
          <SectionErrorBoundary scope="service-design">
            <DesignBrandingPage />
          </SectionErrorBoundary>
        </PublicSiteShell>
      );
    case 'service-web':
      return (
        <PublicSiteShell>
          <SectionErrorBoundary scope="service-web">
            <WebDevelopmentPage />
          </SectionErrorBoundary>
        </PublicSiteShell>
      );
    case 'portfolio':
      return (
        <PublicSiteShell>
          <SectionErrorBoundary scope="portfolio">
            <PortfolioPage />
          </SectionErrorBoundary>
        </PublicSiteShell>
      );
    case 'blog':
      return (
        <PublicSiteShell>
          <SectionErrorBoundary scope="blog">
            <BlogPageEnhanced />
          </SectionErrorBoundary>
        </PublicSiteShell>
      );
    case 'apropos':
      return (
        <PublicSiteShell>
          <SectionErrorBoundary scope="apropos">
            <>
              <Navigation currentPath="/apropos" />
              <div className="pt-20">
                <APropos />
              </div>
              <Footer />
            </>
          </SectionErrorBoundary>
        </PublicSiteShell>
      );
    default:
      return (
        <PublicSiteShell>
          <SectionErrorBoundary scope="home">
            <>
              <Navigation currentPath="/" />
              <HomePageContent />
            </>
          </SectionErrorBoundary>
        </PublicSiteShell>
      );
  }
}
