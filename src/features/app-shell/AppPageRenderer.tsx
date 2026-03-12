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
import CMSDashboard from '../../components/cms/CMSDashboard';
import APropos from '../../imports/APropos';
import HomePageContent from '../marketing/home/HomePageContent';
import type { ResolvedPage } from '../../app-routing/navigationTypes';
import SecurityStatePage from './SecurityStatePage';

interface AppPageRendererProps {
  currentPage: ResolvedPage;
  cmsSection: string;
  onCmsSectionChange: (section: string) => void;
  cmsEnabled: boolean;
  registrationEnabled: boolean;
}

export default function AppPageRenderer({
  currentPage,
  cmsSection,
  onCmsSectionChange,
  cmsEnabled,
  registrationEnabled,
}: AppPageRendererProps) {
  if (currentPage === 'auth-loading') {
    return (
      <SecurityStatePage
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
    if (!registrationEnabled) {
      return (
        <SecurityStatePage
          title="Inscription désactivée"
          description="L'inscription publique est désactivée. Seuls les comptes provisionnés par un administrateur peuvent accéder au CMS."
          actionHref="#login"
          actionLabel="Aller à la connexion"
        />
      );
    }
    return <RegisterPage />;
  }

  if (currentPage === 'cms-dashboard') {
    return <CMSDashboard currentSection={cmsSection} onSectionChange={onCmsSectionChange} />;
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
    return <ProjectDetailPage projectId={projectId} />;
  }

  switch (currentPage) {
    case 'home':
      return (
        <>
          <Navigation currentPath="/" />
          <HomePageContent />
        </>
      );
    case 'projects':
      return <ProjectsPage />;
    case 'services-all':
      return <ServicesHubPage />;
    case 'service-design':
      return <DesignBrandingPage />;
    case 'service-web':
      return <WebDevelopmentPage />;
    case 'portfolio':
      return <PortfolioPage />;
    case 'blog':
      return <BlogPageEnhanced />;
    case 'apropos':
      return (
        <>
          <Navigation currentPath="/apropos" />
          <div className="pt-20">
            <APropos />
          </div>
          <Footer />
        </>
      );
    default:
      return (
        <>
          <Navigation currentPath="/" />
          <HomePageContent />
        </>
      );
  }
}
