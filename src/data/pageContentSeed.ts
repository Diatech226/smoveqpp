export interface HomePageContentSettings {
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroDescription: string;
  heroPrimaryCtaLabel: string;
  heroSecondaryCtaLabel: string;
  aboutBadge: string;
  aboutTitle: string;
  aboutParagraphOne: string;
  aboutParagraphTwo: string;
  aboutImage: string;
  servicesIntroTitle: string;
  servicesIntroSubtitle: string;
}

export const defaultHomePageContent: HomePageContentSettings = {
  heroBadge: 'Agence de communication',
  heroTitleLine1: 'Donnez du relief',
  heroTitleLine2: 'à votre communication',
  heroDescription:
    'Un hero premium avec animation 3D légère, pour valoriser votre image de marque et présenter vos services avec impact.',
  heroPrimaryCtaLabel: 'Découvrir nos services',
  heroSecondaryCtaLabel: 'Lancer un projet',
  aboutBadge: 'À PROPOS DE NOUS',
  aboutTitle: 'Innovation & Excellence Digitale',
  aboutParagraphOne:
    "SMOVE Communication est une agence digitale basée en Côte d'Ivoire, spécialisée dans la création de solutions digitales innovantes. Nous accompagnons les entreprises dans leur transformation digitale avec passion et expertise.",
  aboutParagraphTwo:
    'Notre équipe de professionnels talentueux combine créativité, technologie et stratégie pour créer des expériences digitales qui marquent les esprits et génèrent des résultats mesurables.',
  aboutImage: '',
  servicesIntroTitle: 'Ce que nous faisons',
  servicesIntroSubtitle: 'Des solutions digitales complètes pour propulser votre entreprise vers le succès',
};
