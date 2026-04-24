import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import PortfolioPage from '../../components/PortfolioPage';
import BlogPageEnhanced from '../../components/BlogPageEnhanced';
import BlogDetailPage from '../../components/BlogDetailPage';
import ServicesHubPage from '../../components/ServicesHubPage';
import ServiceDetailPage from '../../components/services/ServiceDetailPage';
import ProjectsPage from '../../components/ProjectsPage';
import ProjectDetailPage from '../../components/ProjectDetailPage';
import ContactPage from '../../components/ContactPage';
import LoginPage from '../../components/auth/LoginPage';
import RegisterPage from '../../components/auth/RegisterPage';
import ForgotPasswordPage from '../../components/auth/ForgotPasswordPage';
import ResetPasswordPage from '../../components/auth/ResetPasswordPage';
import AccountPage from '../../components/auth/AccountPage';
import APropos from '../../imports/APropos';
import HomePageContent from '../marketing/home/HomePageContent';
import type { ResolvedPage } from '../../app-routing/navigationTypes';
import SecurityStatePage from './SecurityStatePage';
import SectionErrorBoundary from './SectionErrorBoundary';
import PublicSiteShell from './PublicSiteShell';
import { AppLoadingState } from './AppStatusState';
import { getCmsAppUrl } from '../../config/cmsRuntime';

interface AppPageRendererProps {
  currentPage: ResolvedPage;
  cmsEnabled: boolean;
}

export default function AppPageRenderer({
  currentPage,
  cmsEnabled
}: AppPageRendererProps) {
  const renderHomePage = () => (
    <PublicSiteShell>
      <SectionErrorBoundary scope="home">
        <>
          <Navigation currentPath="/" />
          <HomePageContent />
        </>
      </SectionErrorBoundary>
    </PublicSiteShell>
  );

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

  if (currentPage === 'forgot-password') {
    return <ForgotPasswordPage />;
  }

  if (currentPage === 'reset-password') {
    return <ResetPasswordPage />;
  }

  if (currentPage === 'account') {
    return <AccountPage />;
  }

  if (currentPage === 'cms-dashboard') {
    return (
      <SecurityStatePage
        title="CMS"
        description="Le CMS est disponible dans la section admin de cette même application."
        actionHref={getCmsAppUrl()}
        actionLabel="Ouvrir le CMS"
      />
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


  if (currentPage.startsWith('blog-')) {
    const slug = currentPage.replace('blog-', '');
    return (
      <PublicSiteShell>
        <SectionErrorBoundary scope="blog-detail">
          <BlogDetailPage slug={slug} />
        </SectionErrorBoundary>
      </PublicSiteShell>
    );
  }


  if (currentPage.startsWith('service-') && currentPage !== 'service-design' && currentPage !== 'service-web') {
    const slug = currentPage.replace('service-', '');
    return (
      <PublicSiteShell>
        <SectionErrorBoundary scope="service-detail">
          <ServiceDetailPage slug={slug} />
        </SectionErrorBoundary>
      </PublicSiteShell>
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
      return renderHomePage();
    case 'projects':
      return (
        <PublicSiteShell>
          <SectionErrorBoundary scope="projects">
            <ProjectsPage />
          </SectionErrorBoundary>
        </PublicSiteShell>
      );
    case 'contact':
      return (
        <PublicSiteShell>
          <SectionErrorBoundary scope="contact">
            <ContactPage />
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
            <ServiceDetailPage slug="design-branding" />
          </SectionErrorBoundary>
        </PublicSiteShell>
      );
    case 'service-web':
      return (
        <PublicSiteShell>
          <SectionErrorBoundary scope="service-web">
            <ServiceDetailPage slug="web-development" />
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
              <Navigation currentPath="/about" />
              <div className="pt-20">
                <APropos />
              </div>
              <Footer />
            </>
          </SectionErrorBoundary>
        </PublicSiteShell>
      );
    default:
      return renderHomePage();
  }
}
