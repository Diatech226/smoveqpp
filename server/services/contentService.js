const BLOG_STATUSES = new Set(['draft', 'in_review', 'published', 'archived']);
const MEDIA_TYPES = new Set(['image', 'video', 'document']);
const PROJECT_STATUSES = new Set(['draft', 'in_review', 'published', 'archived']);
const SERVICE_STATUSES = new Set(['draft', 'published', 'archived']);
const SERVICE_ICONS = new Set(['palette', 'code', 'megaphone', 'video', 'box']);
const COLOR_GRADIENT_PATTERN = /^from-\[#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]\s+to-\[#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MEDIA_REFERENCE_PREFIX = 'media:';

const defaultHomePageContent = {
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


const defaultBlogPosts = [
  {
    id: '1',
    title: 'Création de site web pour SMOVE',
    slug: 'creation-site-web-smove',
    excerpt: "SMOVE propose une vision moderne du web africain, tournée vers l'innovation et l'excellence digitale.",
    content:
      "## Introduction\n\nSMOVE Communication révolutionne le paysage digital africain avec sa nouvelle plateforme web. Ce projet ambitieux combine design moderne, performance technique et expérience utilisateur exceptionnelle.",
    author: 'Spencer Tarring',
    authorRole: 'Lead Developer',
    category: 'Développement Web',
    tags: ['React', 'Web Design', 'Performance', 'Innovation'],
    publishedDate: '2024-02-01',
    readTime: '5 min',
    featuredImage: 'modern website design smove platform',
    images: ['web development coding modern'],
    status: 'published',
  },
  {
    id: '2',
    title: "Communication d'entreprise pour ECLA BTP",
    slug: 'communication-entreprise-ecla-btp',
    excerpt: 'Création de vidéo et affiche publicitaire pour se démarquer dans le secteur du BTP.',
    content:
      "## Le Projet\n\nECLA BTP souhaitait moderniser sa communication pour mieux refléter son positionnement premium dans le secteur de la construction.",
    author: 'James Rodd',
    authorRole: 'Creative Director',
    category: 'Communication',
    tags: ['Vidéo', 'Branding', 'Corporate', 'BTP'],
    publishedDate: '2024-01-28',
    readTime: '4 min',
    featuredImage: 'corporate video production professional',
    images: ['video production studio'],
    status: 'published',
  },
  {
    id: '3',
    title: 'Création de logo et visuels pour Gobon Sarl',
    slug: 'logo-visuels-gobon-sarl',
    excerpt: 'Logo et visuels pour une identité commerciale remarquée dans le secteur alimentaire.',
    content:
      "## Contexte\n\nGobon Sarl, entreprise de distribution alimentaire, avait besoin d'une identité visuelle forte pour se démarquer sur un marché concurrentiel.",
    author: 'David Silvester',
    authorRole: 'Brand Designer',
    category: 'Branding',
    tags: ['Logo Design', 'Identité Visuelle', 'Branding', 'Food'],
    publishedDate: '2024-01-25',
    readTime: '6 min',
    featuredImage: 'logo design creative professional',
    images: ['brand identity design mockup'],
    status: 'published',
  },
];


const defaultServices = [
  {
    id: 'design-branding',
    title: 'Design & Branding',
    slug: 'design-branding',
    description: "Création d'interfaces immersives, animations 3D et expériences interactives, de logo et d'identité visuels.",
    shortDescription: 'Identité visuelle, branding et design d’expériences.',
    color: 'from-[#00b3e8] to-[#00c0e8]',
    icon: 'palette',
    features: ['Logo & Identité', 'UI/UX Design', 'Charte Graphique', 'Motion Design'],
    status: 'published',
    featured: true,
  },
  {
    id: 'web-development',
    title: 'Développement Web & Mobile',
    slug: 'web-development',
    description: 'Applications web modernes, rapides et sécurisées, adaptées à vos besoins métiers.',
    shortDescription: 'Sites, apps et plateformes métiers.',
    color: 'from-[#34c759] to-[#2da84a]',
    icon: 'code',
    features: ['Sites Web', 'Applications Mobile', 'E-commerce', 'Web Apps'],
    status: 'published',
    featured: true,
  },
  {
    id: 'digital-communication',
    title: 'Communication Digitale',
    slug: 'digital-communication',
    description: 'Stratégie de contenu, visibilité en ligne, branding et storytelling digital.',
    shortDescription: 'Acquisition, contenu et notoriété digitale.',
    color: 'from-[#ffc247] to-[#ff9f47]',
    icon: 'megaphone',
    features: ['Stratégie Social Media', 'Content Marketing', 'SEO/SEA', 'Email Marketing'],
    status: 'published',
    featured: false,
  },
  {
    id: 'video-production',
    title: 'Production Vidéo',
    slug: 'video-production',
    description: 'Création de vidéos professionnelles pour vos campagnes marketing et événements.',
    shortDescription: 'Formats vidéo impactants et motion.',
    color: 'from-[#ff6b6b] to-[#ee5a6f]',
    icon: 'video',
    features: ['Vidéos Publicitaires', 'Motion Graphics', 'Montage Vidéo', 'Live Streaming'],
    status: 'published',
    featured: false,
  },
  {
    id: '3d-creation',
    title: 'Création 3D',
    slug: '3d-creation',
    description: 'Modélisation 3D, animations et expériences immersives pour vos projets.',
    shortDescription: '3D, AR/VR et visualisation immersive.',
    color: 'from-[#a855f7] to-[#9333ea]',
    icon: 'box',
    features: ['Modélisation 3D', 'Animation 3D', 'Rendering', 'VR/AR'],
    status: 'published',
    featured: false,
  },
];

const defaultSettings = {
  siteTitle: 'SMOVE',
  supportEmail: 'contact@smove.africa',
  instantPublishing: true,
};

class ContentService {
  constructor({ contentRepository }) {
    this.contentRepository = contentRepository;
  }

  readState() {
    return this.contentRepository.getState
      ? this.contentRepository.getState()
      : {
          blogPosts: this.contentRepository.getBlogPosts(),
          projects: [],
          mediaFiles: [],
          services: [],
          pageContent: null,
          settings: null,
        };
  }

  writeState(state) {
    if (this.contentRepository.saveState) {
      this.contentRepository.saveState(state);
      return;
    }
    this.contentRepository.saveBlogPosts(state.blogPosts || []);
  }

  seedBlogPostsFromLegacy() {
    const state = this.readState();
    const existingPosts = Array.isArray(state.blogPosts) ? state.blogPosts.map((post) => this.normalizePost(post)).filter((post) => this.validateBlogPost(post)) : [];

    if (existingPosts.length === 0) {
      state.blogPosts = defaultBlogPosts.map((post) => this.normalizePost(post));
      this.writeState(state);
      return state.blogPosts;
    }

    const knownSlugs = new Set(existingPosts.map((post) => post.slug));
    const missingSeedPosts = defaultBlogPosts
      .map((post) => this.normalizePost(post))
      .filter((post) => !knownSlugs.has(post.slug));

    if (missingSeedPosts.length > 0) {
      state.blogPosts = [...existingPosts, ...missingSeedPosts];
      this.writeState(state);
      return state.blogPosts;
    }

    return existingPosts;
  }

  listBlogPosts() {
    return this.seedBlogPostsFromLegacy().map((post) => this.normalizePost(post));
  }

  saveBlogPost(post) {
    const normalized = this.normalizePost(post);
    if (!this.validateBlogPost(normalized)) {
      return { ok: false, error: { code: 'BLOG_VALIDATION_ERROR', message: 'Invalid blog payload.' } };
    }

    const posts = this.listBlogPosts();
    const duplicateSlug = posts.find((entry) => entry.slug === normalized.slug && entry.id !== normalized.id);

    const existing = posts.find((entry) => entry.id === normalized.id);
    if (normalized.status === 'published') {
      if (!this.getSettings().instantPublishing) {
        return {
          ok: false,
          error: {
            code: 'BLOG_INSTANT_PUBLISHING_DISABLED',
            message: 'Instant publishing is disabled. Move content to in_review before publishing.',
          },
        };
      }
      const publishability = this.evaluatePublishability(normalized);
      if (!publishability.ok) {
        return { ok: false, error: { code: 'BLOG_NOT_PUBLISHABLE', message: publishability.message } };
      }
      if (!existing || !['in_review', 'published'].includes(existing.status)) {
        return { ok: false, error: { code: 'BLOG_INVALID_STATUS_TRANSITION', message: 'Content must be in review before publishing.' } };
      }
    }

    if (duplicateSlug) {
      return { ok: false, error: { code: 'BLOG_SLUG_CONFLICT', message: 'Slug already exists.' } };
    }

    const index = posts.findIndex((entry) => entry.id === normalized.id);
    if (index >= 0) {
      posts[index] = normalized;
    } else {
      posts.push(normalized);
    }

    const state = this.readState();
    state.blogPosts = posts;
    this.writeState(state);
    return { ok: true, post: normalized };
  }

  deleteBlogPost(id) {
    const state = this.readState();
    const next = this.listBlogPosts().filter((post) => post.id !== id);
    state.blogPosts = next;
    this.writeState(state);
    return { ok: true };
  }

  transitionBlogStatus(id, targetStatus) {
    if (!BLOG_STATUSES.has(targetStatus)) {
      return { ok: false, error: { code: 'BLOG_INVALID_STATUS_TRANSITION', message: 'Invalid target status.' } };
    }

    const posts = this.listBlogPosts();
    const index = posts.findIndex((post) => post.id === id);
    if (index < 0) {
      return { ok: false, error: { code: 'BLOG_NOT_FOUND', message: 'Post not found.' } };
    }

    const current = posts[index];
    const isAllowed = this.isAllowedTransition(current.status, targetStatus);
    if (!isAllowed) {
      return { ok: false, error: { code: 'BLOG_INVALID_STATUS_TRANSITION', message: 'Transition not allowed.' } };
    }

    const next = { ...current, status: targetStatus };
    if (targetStatus === 'published' && !this.getSettings().instantPublishing) {
      return {
        ok: false,
        error: {
          code: 'BLOG_INSTANT_PUBLISHING_DISABLED',
          message: 'Instant publishing is disabled. Keep content in review until publishing is enabled.',
        },
      };
    }
    if (targetStatus === 'published') {
      const publishability = this.evaluatePublishability(next);
      if (!publishability.ok) {
        return { ok: false, error: { code: 'BLOG_NOT_PUBLISHABLE', message: publishability.message } };
      }
    }

    posts[index] = next;
    const state = this.readState();
    state.blogPosts = posts;
    this.writeState(state);
    return { ok: true, post: next };
  }

  getAnalytics() {
    const posts = this.listBlogPosts();
    return {
      drafts: posts.filter((post) => post.status === 'draft').length,
      inReview: posts.filter((post) => post.status === 'in_review').length,
      published: posts.filter((post) => post.status === 'published').length,
      archived: posts.filter((post) => post.status === 'archived').length,
      recentlyUpdated: posts
        .slice()
        .sort((a, b) => Date.parse(b.publishedDate) - Date.parse(a.publishedDate))
        .slice(0, 5)
        .map((post) => ({ id: post.id, title: post.title, status: post.status, publishedDate: post.publishedDate })),
    };
  }

  listProjects() {
    return (this.readState().projects || [])
      .map((project) => this.normalizeProject(project))
      .filter((project) => this.validateProject(project))
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Number.parseInt(b.year, 10) - Number.parseInt(a.year, 10));
  }

  saveProject(project) {
    const normalized = this.normalizeProject(project);
    if (!this.validateProject(normalized)) {
      return { ok: false, error: { code: 'PROJECT_VALIDATION_ERROR', message: 'Invalid project payload.' } };
    }

    const state = this.readState();
    const projects = this.listProjects();
    const duplicateSlug = projects.find((entry) => entry.slug === normalized.slug && entry.id !== normalized.id);
    if (duplicateSlug) {
      return { ok: false, error: { code: 'PROJECT_SLUG_CONFLICT', message: 'Project slug already exists.' } };
    }

    const existing = projects.find((entry) => entry.id === normalized.id);
    if (normalized.status === 'published') {
      const publishability = this.evaluateProjectPublishability(normalized);
      if (!publishability.ok) {
        return { ok: false, error: { code: 'PROJECT_NOT_PUBLISHABLE', message: publishability.message } };
      }
      if (!existing || !['in_review', 'published'].includes(existing.status)) {
        return { ok: false, error: { code: 'PROJECT_INVALID_STATUS_TRANSITION', message: 'Project must be in review before publishing.' } };
      }
    }

    const index = projects.findIndex((entry) => entry.id === normalized.id);
    if (index >= 0) projects[index] = normalized;
    else projects.push(normalized);
    state.projects = projects;
    this.writeState(state);
    return { ok: true, project: normalized };
  }


  transitionProjectStatus(id, targetStatus, actor = {}) {
    if (!PROJECT_STATUSES.has(targetStatus)) {
      return { ok: false, error: { code: 'PROJECT_INVALID_STATUS_TRANSITION', message: 'Invalid target status.' } };
    }

    const projects = this.listProjects();
    const index = projects.findIndex((project) => project.id === id);
    if (index < 0) {
      return { ok: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } };
    }

    const current = projects[index];
    const isAllowed = this.isAllowedTransition(current.status || 'draft', targetStatus);
    if (!isAllowed) {
      return { ok: false, error: { code: 'PROJECT_INVALID_STATUS_TRANSITION', message: 'Transition not allowed.' } };
    }

    const reviewedBy = typeof actor?.reviewedBy === 'string' ? actor.reviewedBy.trim() : '';
    const next = { ...current, status: targetStatus };

    if (targetStatus === 'published') {
      const publishability = this.evaluateProjectPublishability(next);
      if (!publishability.ok) {
        return { ok: false, error: { code: 'PROJECT_NOT_PUBLISHABLE', message: publishability.message } };
      }
      next.reviewedAt = new Date().toISOString();
      if (reviewedBy) next.reviewedBy = reviewedBy;
    }

    if (targetStatus === 'in_review') {
      next.reviewedAt = new Date().toISOString();
      if (reviewedBy) next.reviewedBy = reviewedBy;
    }

    projects[index] = this.normalizeProject(next);
    const state = this.readState();
    state.projects = projects;
    this.writeState(state);
    return { ok: true, project: projects[index] };
  }

  deleteProject(id) {
    const state = this.readState();
    state.projects = this.listProjects().filter((entry) => entry.id !== id);
    this.writeState(state);
    return { ok: true };
  }


  seedServicesFromLegacy() {
    const state = this.readState();
    const existingServices = Array.isArray(state.services)
      ? state.services.map((service) => this.normalizeService(service)).filter((service) => this.validateService(service))
      : [];

    if (existingServices.length === 0) {
      state.services = defaultServices.map((service) => this.normalizeService(service));
      this.writeState(state);
      return state.services;
    }

    const knownSlugs = new Set(existingServices.map((service) => service.slug));
    const missingSeedServices = defaultServices
      .map((service) => this.normalizeService(service))
      .filter((service) => !knownSlugs.has(service.slug));

    if (missingSeedServices.length > 0) {
      state.services = [...existingServices, ...missingSeedServices];
      this.writeState(state);
      return state.services;
    }

    return existingServices;
  }

  listServices() {
    return this.seedServicesFromLegacy()
      .map((service) => this.normalizeService(service))
      .filter((service) => this.validateService(service))
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.title.localeCompare(b.title, 'fr'));
  }

  saveService(service) {
    const normalized = this.normalizeService(service);
    if (!this.validateService(normalized)) {
      return { ok: false, error: { code: 'SERVICE_VALIDATION_ERROR', message: 'Invalid service payload.' } };
    }

    const services = this.listServices();
    const slugConflict = services.find((entry) => entry.slug === normalized.slug && entry.id !== normalized.id);
    if (slugConflict) {
      return { ok: false, error: { code: 'SERVICE_SLUG_CONFLICT', message: 'Service slug already exists.' } };
    }

    const index = services.findIndex((entry) => entry.id === normalized.id);
    if (index >= 0) services[index] = normalized;
    else services.push(normalized);

    const state = this.readState();
    state.services = services;
    this.writeState(state);
    return { ok: true, service: normalized };
  }

  deleteService(id) {
    const state = this.readState();
    state.services = this.listServices().filter((entry) => entry.id !== id);
    this.writeState(state);
    return { ok: true };
  }

  listMediaFiles() {
    return this.readState().mediaFiles.filter((file) => this.validateMediaFile(file)).map((file) => this.normalizeMediaFile(file));
  }

  saveMediaFile(file) {
    const normalized = this.normalizeMediaFile(file);
    if (!this.validateMediaFile(normalized)) {
      return { ok: false, error: { code: 'MEDIA_VALIDATION_ERROR', message: 'Invalid media payload.' } };
    }

    const state = this.readState();
    const files = this.listMediaFiles();
    const index = files.findIndex((entry) => entry.id === normalized.id);
    if (index >= 0) files[index] = normalized;
    else files.push(normalized);
    state.mediaFiles = files;
    this.writeState(state);
    return { ok: true, mediaFile: normalized };
  }

  deleteMediaFile(id) {
    const state = this.readState();
    state.mediaFiles = this.listMediaFiles().filter((entry) => entry.id !== id);
    this.writeState(state);
    return { ok: true };
  }

  getPageContent() {
    const candidate = this.readState().pageContent;
    if (!candidate || typeof candidate !== 'object') {
      return { home: { ...defaultHomePageContent } };
    }
    return { home: this.normalizeHomePageContent(candidate.home || {}) };
  }

  savePageContent(payload) {
    const normalized = { home: this.normalizeHomePageContent(payload?.home || {}) };
    if (!this.validateHomePageContent(normalized.home)) {
      return { ok: false, error: { code: 'PAGE_CONTENT_VALIDATION_ERROR', message: 'Invalid page content payload.' } };
    }

    const state = this.readState();
    state.pageContent = normalized;
    this.writeState(state);
    return { ok: true, pageContent: normalized };
  }

  getSettings() {
    const candidate = this.readState().settings;
    return this.normalizeSettings(candidate || {});
  }

  saveSettings(payload) {
    const normalized = this.normalizeSettings(payload || {});
    if (!normalized.siteTitle.trim() || !normalized.supportEmail.includes('@')) {
      return { ok: false, error: { code: 'SETTINGS_VALIDATION_ERROR', message: 'Invalid settings payload.' } };
    }

    const state = this.readState();
    state.settings = normalized;
    this.writeState(state);
    return { ok: true, settings: normalized };
  }

  evaluatePublishability(post) {
    if (!post.title?.trim() || !post.slug?.trim() || !post.featuredImage?.trim()) {
      return { ok: false, message: 'Missing required publish fields.' };
    }
    if (!this.isValidDate(post.publishedDate)) {
      return { ok: false, message: 'Published date must be a valid ISO date.' };
    }
    if (!this.isValidMediaLink(post.featuredImage)) {
      return { ok: false, message: 'Featured image must be a valid URL or media reference.' };
    }
    return { ok: true };
  }


  evaluateProjectPublishability(project) {
    const summarySource = typeof project.summary === 'string' && project.summary.trim()
      ? project.summary.trim()
      : `${project.description || ''}`.trim();
    if (!project.title?.trim() || !project.slug?.trim() || !project.featuredImage?.trim()) {
      return { ok: false, message: 'Missing required publish fields.' };
    }
    if (!this.isValidMediaLink(project.featuredImage)) {
      return { ok: false, message: 'Featured image must be a valid URL or media reference.' };
    }
    if (!summarySource || summarySource.length < 24) {
      return { ok: false, message: 'Summary/description must contain at least 24 characters.' };
    }
    return { ok: true };
  }

  isAllowedTransition(current, target) {
    const map = {
      draft: new Set(['in_review', 'archived']),
      in_review: new Set(['draft', 'published', 'archived']),
      published: new Set(['draft', 'archived']),
      archived: new Set(['draft']),
    };

    return Boolean(map[current] && map[current].has(target));
  }

  normalizePost(raw) {
    const status = BLOG_STATUSES.has(raw?.status) ? raw.status : 'draft';
    const title = typeof raw?.title === 'string' ? raw.title.trim() : '';
    const slug = this.normalizeSlug(typeof raw?.slug === 'string' ? raw.slug : title || raw?.id || 'article');
    const excerpt = typeof raw?.excerpt === 'string' ? raw.excerpt.trim() : '';
    const content = typeof raw?.content === 'string' ? raw.content.trim() : '';

    return {
      ...raw,
      status,
      title,
      slug,
      excerpt: excerpt || (content ? content.slice(0, 160) : `Résumé à compléter pour ${title || 'cet article'}.`),
      content: content || 'Contenu à compléter.',
      author: typeof raw?.author === 'string' && raw.author.trim() ? raw.author.trim() : 'Équipe SMOVE',
      authorRole: typeof raw?.authorRole === 'string' && raw.authorRole.trim() ? raw.authorRole.trim() : 'CMS Editor',
      category: typeof raw?.category === 'string' && raw.category.trim() ? raw.category.trim() : 'Non classé',
      tags: Array.isArray(raw?.tags) ? raw.tags.map((tag) => `${tag}`.trim()).filter(Boolean) : [],
      publishedDate: this.isValidDate(raw?.publishedDate) ? new Date(raw.publishedDate).toISOString() : new Date().toISOString(),
      readTime: typeof raw?.readTime === 'string' && raw.readTime.trim() ? raw.readTime.trim() : '5 min',
      featuredImage: typeof raw?.featuredImage === 'string' && raw.featuredImage.trim() ? raw.featuredImage.trim() : 'blog article image',
      images: Array.isArray(raw?.images) ? raw.images.map((entry) => `${entry}`.trim()).filter(Boolean) : [],
      mediaRoles: {
        featuredImage:
          (raw?.mediaRoles && typeof raw.mediaRoles.featuredImage === 'string' && raw.mediaRoles.featuredImage.trim()) ||
          (typeof raw?.featuredImage === 'string' && raw.featuredImage.trim()) ||
          'blog article image',
        socialImage:
          (raw?.mediaRoles && typeof raw.mediaRoles.socialImage === 'string' && raw.mediaRoles.socialImage.trim()) ||
          (raw?.seo && typeof raw.seo.socialImage === 'string' && raw.seo.socialImage.trim()) ||
          (typeof raw?.featuredImage === 'string' && raw.featuredImage.trim()) ||
          'blog article image',
      },
    };
  }

  isValidDate(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    return !Number.isNaN(Date.parse(value));
  }

  isValidHttpUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    try {
      const candidate = new URL(value);
      return candidate.protocol === 'http:' || candidate.protocol === 'https:';
    } catch {
      return false;
    }
  }

  isMediaReference(value) {
    return typeof value === 'string' && value.trim().startsWith(MEDIA_REFERENCE_PREFIX);
  }

  mediaIdFromReference(value) {
    return value.slice(MEDIA_REFERENCE_PREFIX.length).trim();
  }

  doesMediaReferenceExist(value) {
    if (!this.isMediaReference(value)) return false;
    const mediaId = this.mediaIdFromReference(value);
    if (!mediaId) return false;
    return this.listMediaFiles().some((entry) => entry.id === mediaId);
  }

  isValidMediaLink(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    if (this.isMediaReference(value)) {
      return this.doesMediaReferenceExist(value);
    }
    return this.isValidHttpUrl(value) || !value.includes('://');
  }

  validateBlogPost(post) {
    return Boolean(
      post &&
      typeof post.id === 'string' &&
      typeof post.title === 'string' &&
      typeof post.slug === 'string' &&
      typeof post.excerpt === 'string' &&
      typeof post.content === 'string' &&
      typeof post.author === 'string' &&
      typeof post.authorRole === 'string' &&
      typeof post.category === 'string' &&
      Array.isArray(post.tags) &&
      this.isValidDate(post.publishedDate) &&
      typeof post.readTime === 'string' &&
      post.readTime.trim().length > 0 &&
      typeof post.featuredImage === 'string' &&
      post.featuredImage.trim().length > 0 &&
      this.isValidMediaLink(post.featuredImage) &&
      Array.isArray(post.images) &&
      post.images.every((image) => this.isValidMediaLink(image)) &&
      (post.seo === undefined ||
        (typeof post.seo === 'object' &&
          (post.seo.socialImage === undefined || this.isValidMediaLink(post.seo.socialImage)))) &&
      (post.mediaRoles === undefined ||
        (typeof post.mediaRoles === 'object' &&
          (post.mediaRoles.featuredImage === undefined || this.isValidMediaLink(post.mediaRoles.featuredImage)) &&
          (post.mediaRoles.socialImage === undefined || this.isValidMediaLink(post.mediaRoles.socialImage)))) &&
      SLUG_PATTERN.test(post.slug.trim()) &&
      BLOG_STATUSES.has(post.status)
    );
  }

  normalizeProject(project) {
    const asTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');
    const title = asTrimmedString(project?.title);
    const slug = this.normalizeSlug(asTrimmedString(project?.slug) || title || asTrimmedString(project?.id));
    const status = PROJECT_STATUSES.has(project?.status) ? project.status : 'published';
    const nowIso = new Date().toISOString();

    const roleCardImage = asTrimmedString(project?.mediaRoles?.cardImage);
    const roleHeroImage = asTrimmedString(project?.mediaRoles?.heroImage);
    const roleGalleryImages = Array.isArray(project?.mediaRoles?.galleryImages) ? project.mediaRoles.galleryImages.map((entry) => `${entry}`.trim()).filter(Boolean) : [];
    const featuredImage = roleCardImage || asTrimmedString(project?.featuredImage) || asTrimmedString(project?.mainImage) || 'project cover image';
    const heroImage = roleHeroImage || asTrimmedString(project?.mainImage) || featuredImage;

    return {
      ...project,
      id: asTrimmedString(project?.id),
      title,
      slug,
      summary: asTrimmedString(project?.summary) || undefined,
      client: asTrimmedString(project?.client),
      category: asTrimmedString(project?.category),
      year: asTrimmedString(project?.year) || new Date().getFullYear().toString(),
      description: asTrimmedString(project?.description) || asTrimmedString(project?.summary) || 'Description à compléter.',
      challenge: asTrimmedString(project?.challenge) || 'Challenge à compléter.',
      solution: asTrimmedString(project?.solution) || 'Solution à compléter.',
      results: Array.isArray(project?.results) ? project.results.map((entry) => `${entry}`.trim()).filter(Boolean) : [],
      tags: Array.isArray(project?.tags) ? project.tags.map((entry) => `${entry}`.trim()).filter(Boolean) : [],
      mainImage: heroImage,
      featuredImage,
      imageAlt: asTrimmedString(project?.imageAlt) || title || 'Projet SMOVE',
      images: Array.isArray(project?.images)
        ? project.images.map((entry) => `${entry}`.trim()).filter(Boolean)
        : heroImage
          ? [heroImage]
          : [],
      mediaRoles: {
        cardImage: featuredImage,
        heroImage,
        galleryImages: roleGalleryImages.length > 0
          ? roleGalleryImages
          : Array.isArray(project?.images)
            ? project.images.map((entry) => `${entry}`.trim()).filter(Boolean)
            : heroImage
              ? [heroImage]
              : [],
      },
      featured: Boolean(project?.featured),
      status,
      reviewedAt: typeof project?.reviewedAt === 'string' ? project.reviewedAt : undefined,
      reviewedBy: typeof project?.reviewedBy === 'string' ? project.reviewedBy.trim() || undefined : undefined,
      createdAt: project?.createdAt || nowIso,
      updatedAt: nowIso,
      link: asTrimmedString(project?.link) || (project?.links && typeof project.links.live === 'string' ? project.links.live.trim() : '') || undefined,
      links: project?.links && typeof project.links === 'object'
        ? {
            live: typeof project.links.live === 'string' ? project.links.live.trim() : asTrimmedString(project?.link) || undefined,
            caseStudy: typeof project.links.caseStudy === 'string' ? project.links.caseStudy.trim() : undefined,
          }
        : asTrimmedString(project?.link)
          ? { live: asTrimmedString(project?.link) }
          : undefined,
      testimonial:
        project?.testimonial &&
        typeof project.testimonial === 'object' &&
        typeof project.testimonial.text === 'string' &&
        typeof project.testimonial.author === 'string' &&
        typeof project.testimonial.position === 'string' &&
        project.testimonial.text.trim() &&
        project.testimonial.author.trim() &&
        project.testimonial.position.trim()
          ? {
              text: project.testimonial.text.trim(),
              author: project.testimonial.author.trim(),
              position: project.testimonial.position.trim(),
            }
          : undefined,
    };
  }

  validateProject(project) {
    return Boolean(
      project &&
        typeof project.id === 'string' &&
        project.id.length > 0 &&
        typeof project.title === 'string' &&
        project.title.length > 0 &&
        typeof project.slug === 'string' &&
        project.slug.length > 0 &&
        SLUG_PATTERN.test(project.slug) &&
        typeof project.client === 'string' &&
        typeof project.category === 'string' &&
        typeof project.year === 'string' &&
        /^\d{4}$/.test(project.year) &&
        typeof project.description === 'string' &&
        typeof project.challenge === 'string' &&
        typeof project.solution === 'string' &&
        Array.isArray(project.results) &&
        Array.isArray(project.tags) &&
        typeof project.mainImage === 'string' &&
        project.mainImage.length > 0 &&
        this.isValidMediaLink(project.mainImage) &&
        typeof project.featuredImage === 'string' &&
        project.featuredImage.length > 0 &&
        this.isValidMediaLink(project.featuredImage) &&
        typeof project.imageAlt === 'string' &&
        (project.mediaRoles === undefined ||
          (typeof project.mediaRoles === 'object' &&
            (project.mediaRoles.cardImage === undefined || this.isValidMediaLink(project.mediaRoles.cardImage)) &&
            (project.mediaRoles.heroImage === undefined || this.isValidMediaLink(project.mediaRoles.heroImage)) &&
            (project.mediaRoles.galleryImages === undefined || (Array.isArray(project.mediaRoles.galleryImages) && project.mediaRoles.galleryImages.every((image) => this.isValidMediaLink(image)))))) &&
        (project.link === undefined || this.isValidHttpUrl(project.link)) &&
        (project.links === undefined ||
          (typeof project.links === 'object' &&
            (project.links.live === undefined || this.isValidHttpUrl(project.links.live)) &&
            (project.links.caseStudy === undefined || this.isValidHttpUrl(project.links.caseStudy)))) &&
        (project.testimonial === undefined ||
          (typeof project.testimonial === 'object' &&
            typeof project.testimonial.text === 'string' &&
            typeof project.testimonial.author === 'string' &&
            typeof project.testimonial.position === 'string')) &&
        Array.isArray(project.images) &&
        project.images.every((image) => this.isValidMediaLink(image)) &&
        PROJECT_STATUSES.has(project.status)
    );
  }



  normalizeService(service) {
    const asTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');
    const title = asTrimmedString(service?.title);
    const nowIso = new Date().toISOString();

    return {
      ...service,
      id: asTrimmedString(service?.id),
      title,
      slug: this.normalizeSlug(asTrimmedString(service?.slug) || title || asTrimmedString(service?.id)),
      description: asTrimmedString(service?.description),
      shortDescription: asTrimmedString(service?.shortDescription) || undefined,
      icon: asTrimmedString(service?.icon) || 'palette',
      iconLikeAsset: asTrimmedString(service?.iconLikeAsset) || undefined,
      routeSlug: this.normalizeSlug(asTrimmedString(service?.routeSlug) || asTrimmedString(service?.slug) || title || asTrimmedString(service?.id)),
      overviewTitle: asTrimmedString(service?.overviewTitle) || undefined,
      overviewDescription: asTrimmedString(service?.overviewDescription) || undefined,
      ctaTitle: asTrimmedString(service?.ctaTitle) || undefined,
      ctaDescription: asTrimmedString(service?.ctaDescription) || undefined,
      ctaPrimaryLabel: asTrimmedString(service?.ctaPrimaryLabel) || undefined,
      ctaPrimaryHref: asTrimmedString(service?.ctaPrimaryHref) || undefined,
      color: asTrimmedString(service?.color) || 'from-[#00b3e8] to-[#00c0e8]',
      features: Array.isArray(service?.features) ? service.features.map((entry) => `${entry}`.trim()).filter(Boolean) : [],
      status: SERVICE_STATUSES.has(service?.status) ? service.status : 'published',
      featured: Boolean(service?.featured),
      createdAt: service?.createdAt || nowIso,
      updatedAt: nowIso,
    };
  }

  validateService(service) {
    return Boolean(
      service &&
        typeof service.id === 'string' &&
        service.id.length > 0 &&
        typeof service.title === 'string' &&
        service.title.length > 0 &&
        typeof service.slug === 'string' &&
        service.slug.length > 0 &&
        SLUG_PATTERN.test(service.slug) &&
        typeof service.routeSlug === 'string' &&
        service.routeSlug.length > 0 &&
        SLUG_PATTERN.test(service.routeSlug) &&
        (service.iconLikeAsset === undefined || this.isValidMediaLink(service.iconLikeAsset)) &&
        typeof service.description === 'string' &&
        service.description.length > 0 &&
        typeof service.icon === 'string' &&
        service.icon.length > 0 &&
        SERVICE_ICONS.has(service.icon) &&
        typeof service.color === 'string' &&
        service.color.length > 0 &&
        COLOR_GRADIENT_PATTERN.test(service.color) &&
        Array.isArray(service.features) &&
        service.features.length > 0 &&
        SERVICE_STATUSES.has(service.status)
    );
  }

  normalizeSlug(input) {
    return `${input || ''}`
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  normalizeMediaFile(file) {
    const normalizedName = (file?.name || '').trim();
    const normalizedAlt = (file?.alt || '').trim() || normalizedName;
    const nowIso = new Date().toISOString();

    return {
      ...file,
      name: normalizedName,
      title: (file?.title || '').trim() || normalizedName,
      label: (file?.label || '').trim() || normalizedName,
      alt: normalizedAlt,
      caption: (file?.caption || '').trim() || normalizedAlt,
      tags: Array.isArray(file?.tags) ? file.tags.map((tag) => `${tag}`.trim()).filter(Boolean) : [],
      source: (file?.source || '').trim() || 'content-api',
      metadata: file?.metadata && typeof file.metadata === 'object' ? file.metadata : {},
      thumbnailUrl: (file?.thumbnailUrl || '').trim() || file?.url,
      createdAt: file?.createdAt || file?.uploadedDate || nowIso,
      updatedAt: nowIso,
    };
  }

  validateMediaFile(file) {
    return Boolean(
      file &&
        typeof file.id === 'string' &&
        typeof file.name === 'string' &&
        file.name.length > 0 &&
        MEDIA_TYPES.has(file.type) &&
        typeof file.url === 'string' &&
        file.url.length > 0 &&
        (this.isValidHttpUrl(file.url) || file.url.startsWith('data:') || file.url.startsWith('/')) &&
        (file.thumbnailUrl === undefined || this.isValidHttpUrl(file.thumbnailUrl) || file.thumbnailUrl.startsWith('data:') || file.thumbnailUrl.startsWith('/')) &&
        typeof file.size === 'number' &&
        file.size >= 0 &&
        this.isValidDate(file.uploadedDate) &&
        typeof file.uploadedBy === 'string' &&
        Array.isArray(file.tags)
    );
  }

  normalizeHomePageContent(value) {
    const home = value && typeof value === 'object' ? value : {};
    const normalized = {};
    for (const [key, fallback] of Object.entries(defaultHomePageContent)) {
      normalized[key] = typeof home[key] === 'string' ? home[key].trim() || fallback : fallback;
    }
    return normalized;
  }

  validateHomePageContent(home) {
    return Object.keys(defaultHomePageContent).every((key) => typeof home[key] === 'string') &&
      typeof home.heroTitleLine1 === 'string' &&
      home.heroTitleLine1.trim().length > 0 &&
      typeof home.heroTitleLine2 === 'string' &&
      home.heroTitleLine2.trim().length > 0 &&
      (!home.aboutImage || this.isValidMediaLink(home.aboutImage));
  }

  findMediaReferences(mediaId) {
    const mediaRef = `${MEDIA_REFERENCE_PREFIX}${mediaId}`;
    const references = [];

    this.listBlogPosts().forEach((post) => {
      if (post.featuredImage === mediaRef) {
        references.push({ domain: 'blog', id: post.id, field: 'featuredImage', label: post.title });
      }
      if (Array.isArray(post.images) && post.images.some((image) => image === mediaRef)) {
        references.push({ domain: 'blog', id: post.id, field: 'images', label: post.title });
      }
      if (post.mediaRoles?.featuredImage === mediaRef) {
        references.push({ domain: 'blog', id: post.id, field: 'mediaRoles.featuredImage', label: post.title });
      }
      if (post.seo?.socialImage === mediaRef || post.mediaRoles?.socialImage === mediaRef) {
        references.push({ domain: 'blog', id: post.id, field: 'seo.socialImage', label: post.title });
      }
    });

    this.listProjects().forEach((project) => {
      if (project.featuredImage === mediaRef || project.mainImage === mediaRef) {
        references.push({ domain: 'project', id: project.id, field: 'featuredImage', label: project.title });
      }
      if (Array.isArray(project.images) && project.images.some((image) => image === mediaRef)) {
        references.push({ domain: 'project', id: project.id, field: 'images', label: project.title });
      }
    });

    const home = this.getPageContent().home;
    if (home.aboutImage === mediaRef) {
      references.push({ domain: 'home', id: 'home', field: 'aboutImage', label: 'Home page' });
    }

    return references;
  }

  normalizeSettings(settings) {
    return {
      siteTitle: typeof settings.siteTitle === 'string' ? settings.siteTitle.trim() || defaultSettings.siteTitle : defaultSettings.siteTitle,
      supportEmail:
        typeof settings.supportEmail === 'string'
          ? settings.supportEmail.trim() || defaultSettings.supportEmail
          : defaultSettings.supportEmail,
      instantPublishing: typeof settings.instantPublishing === 'boolean' ? settings.instantPublishing : defaultSettings.instantPublishing,
    };
  }
}

module.exports = { ContentService };
