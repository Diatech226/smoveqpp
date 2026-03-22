const {
  SLUG_PATTERN,
  MEDIA_REFERENCE_PREFIX,
  normalizeSlug: normalizeSharedSlug,
  isValidSlug,
  isHttpUrl,
  isValidOptionalHttpUrl,
  isValidContentHref: isValidContentHrefContract,
  isMediaReference: isMediaReferenceContract,
  mediaIdFromReference: mediaIdFromReferenceContract,
  isValidMediaFieldValue,
  requiredTrimmed,
  hasMinTrimmedLength,
  normalizeStringArray,
} = require('../utils/contentContracts');

const BLOG_STATUSES = new Set(['draft', 'in_review', 'published', 'archived']);
const MEDIA_TYPES = new Set(['image', 'video', 'document']);
const PROJECT_STATUSES = new Set(['draft', 'in_review', 'published', 'archived']);
const SERVICE_STATUSES = new Set(['draft', 'published', 'archived']);
const SERVICE_ICONS = new Set(['palette', 'code', 'megaphone', 'video', 'box']);
const COLOR_GRADIENT_PATTERN = /^from-\[#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]\s+to-\[#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]$/;
const MEDIA_ROLE_PRESETS = new Set(['cardImage', 'heroImage', 'coverImage', 'socialImage', 'galleryImage', 'iconLikeAsset', 'brandLogo', 'favicon']);
const MANAGED_BLOG_CATEGORIES = ['Développement Web', 'Communication', 'Branding', 'Marketing Digital', 'Innovation', 'Études de cas', 'Non classé'];
const MANAGED_BLOG_TAGS = ['React', 'Web Design', 'Performance', 'Innovation', 'Vidéo', 'Branding', 'Corporate', 'BTP', 'Logo Design', 'Identité Visuelle', 'Food', 'SEO', 'Social Media', 'CMS'];

const defaultHomePageContent = {
  heroBadge: 'Agence de communication',
  heroTitleLine1: 'Donnez du relief',
  heroTitleLine2: 'à votre communication',
  heroDescription:
    'Un hero premium avec animation 3D légère, pour valoriser votre image de marque et présenter vos services avec impact.',
  heroPrimaryCtaLabel: 'Découvrir nos services',
  heroPrimaryCtaHref: '#services',
  heroSecondaryCtaLabel: 'Lancer un projet',
  heroSecondaryCtaHref: '#contact',
  aboutBadge: 'À PROPOS DE NOUS',
  aboutTitle: 'Innovation & Excellence Digitale',
  aboutParagraphOne:
    "SMOVE Communication est une agence digitale basée en Côte d'Ivoire, spécialisée dans la création de solutions digitales innovantes. Nous accompagnons les entreprises dans leur transformation digitale avec passion et expertise.",
  aboutParagraphTwo:
    'Notre équipe de professionnels talentueux combine créativité, technologie et stratégie pour créer des expériences digitales qui marquent les esprits et génèrent des résultats mesurables.',
  aboutCtaLabel: 'Découvrir notre équipe',
  aboutCtaHref: '#portfolio',
  aboutImage: '',
  servicesIntroTitle: 'Ce que nous faisons',
  servicesIntroSubtitle: 'Des solutions digitales complètes pour propulser votre entreprise vers le succès',
  portfolioBadge: 'PORTFOLIO',
  portfolioTitle: 'Nos derniers projets',
  portfolioSubtitle: 'Découvrez comment nous avons aidé nos clients à atteindre leurs objectifs',
  portfolioCtaLabel: 'Voir tous nos projets',
  portfolioCtaHref: '#projects',
  blogBadge: 'BLOG',
  blogTitle: 'Derniers articles',
  blogSubtitle: 'Actualités, conseils et insights sur le digital',
  blogCtaLabel: 'Voir tous les articles',
  blogCtaHref: '#blog',
  contactTitle: 'Travaillons ensemble',
  contactSubtitle:
    'Vous avez un projet en tête ? Contactez-nous et discutons de la manière dont nous pouvons vous aider à le réaliser.',
  contactSubmitLabel: 'Envoyer le message',
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
  siteSettings: {
    siteTitle: 'SMOVE',
    supportEmail: 'contact@smove.africa',
    brandMedia: {
      logo: '',
      logoDark: '',
      favicon: '',
      defaultSocialImage: '',
    },
  },
  operationalSettings: {
    instantPublishing: true,
  },
  taxonomySettings: {
    blog: {
      managedCategories: MANAGED_BLOG_CATEGORIES,
      managedTags: MANAGED_BLOG_TAGS,
      enforceManagedTags: true,
    },
  },
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
      if (!this.getSettings().operationalSettings.instantPublishing) {
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
    if (targetStatus === 'published' && !this.getSettings().operationalSettings.instantPublishing) {
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
    if (normalized.status === 'published') {
      const publishability = this.evaluateServicePublishability(normalized);
      if (!publishability.ok) {
        return { ok: false, error: { code: 'SERVICE_NOT_PUBLISHABLE', message: publishability.message } };
      }
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

  listMediaFiles(options = {}) {
    const includeArchived = Boolean(options.includeArchived);
    return this.readState().mediaFiles
      .filter((file) => this.validateMediaFile(file))
      .map((file) => this.normalizeMediaFile(file))
      .filter((file) => includeArchived || !file.archivedAt);
  }

  saveMediaFile(file) {
    const normalized = this.normalizeMediaFile(file);
    if (!this.validateMediaFile(normalized)) {
      return { ok: false, error: { code: 'MEDIA_VALIDATION_ERROR', message: 'Invalid media payload.' } };
    }

    const state = this.readState();
    const files = this.listMediaFiles({ includeArchived: true });
    const index = files.findIndex((entry) => entry.id === normalized.id);
    if (index >= 0) files[index] = normalized;
    else files.push(normalized);
    state.mediaFiles = files;
    this.writeState(state);
    return { ok: true, mediaFile: normalized };
  }

  archiveMediaFile(id) {
    const references = this.findMediaReferences(id);
    if (references.length > 0) {
      return { ok: false, error: { code: 'MEDIA_IN_USE', message: 'Media file is still referenced by published or editable content.', references } };
    }

    const files = this.listMediaFiles({ includeArchived: true });
    const index = files.findIndex((entry) => entry.id === id);
    if (index < 0) {
      return { ok: false, error: { code: 'MEDIA_NOT_FOUND', message: 'Media file not found.' } };
    }

    files[index] = {
      ...files[index],
      archivedAt: files[index].archivedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const state = this.readState();
    state.mediaFiles = files;
    this.writeState(state);
    return { ok: true, mediaFile: files[index] };
  }

  replaceMediaFile(id, nextPayload = {}) {
    const files = this.listMediaFiles({ includeArchived: true });
    const index = files.findIndex((entry) => entry.id === id);
    if (index < 0) {
      return { ok: false, error: { code: 'MEDIA_NOT_FOUND', message: 'Media file not found.' } };
    }

    const merged = this.normalizeMediaFile({
      ...files[index],
      ...nextPayload,
      id,
      archivedAt: null,
      replacedAt: new Date().toISOString(),
    });
    if (!this.validateMediaFile(merged)) {
      return { ok: false, error: { code: 'MEDIA_VALIDATION_ERROR', message: 'Invalid media payload.' } };
    }

    files[index] = merged;
    const state = this.readState();
    state.mediaFiles = files;
    this.writeState(state);
    return { ok: true, mediaFile: merged };
  }

  deleteMediaFile(id) {
    const state = this.readState();
    state.mediaFiles = this.listMediaFiles({ includeArchived: true }).filter((entry) => entry.id !== id);
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

  getPublicSettings() {
    return this.getSettings().siteSettings;
  }

  getBlogTaxonomy() {
    return this.getSettings().taxonomySettings.blog;
  }

  listSettingsHistory(limit = 20) {
    const history = Array.isArray(this.readState().settingsHistory) ? this.readState().settingsHistory : [];
    const parsed = Number.parseInt(`${limit}`, 10);
    const safeLimit = Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
    return history.slice(0, safeLimit);
  }

  rollbackSettings(versionId, actor = {}) {
    const state = this.readState();
    const history = Array.isArray(state.settingsHistory) ? state.settingsHistory : [];
    const version = history.find((entry) => entry.versionId === versionId);
    if (!version) {
      return { ok: false, error: { code: 'SETTINGS_ROLLBACK_NOT_FOUND', message: 'Requested settings version was not found.' } };
    }

    const restoredSettings = this.normalizeSettings(version.snapshot || {});
    const currentSettings = this.getSettings();
    const diff = this.buildSettingsDiff(currentSettings, restoredSettings);

    state.settings = restoredSettings;
    state.settingsHistory = [
      {
        versionId: `settings-${Date.now()}`,
        changedAt: new Date().toISOString(),
        changedBy: typeof actor?.changedBy === 'string' && actor.changedBy.trim() ? actor.changedBy.trim() : 'unknown',
        changedFields: diff.changedFields,
        changeSummary: diff.changeSummary,
        rollbackOf: versionId,
        snapshot: restoredSettings,
      },
      ...history,
    ].slice(0, 100);
    this.writeState(state);
    return { ok: true, settings: restoredSettings, rollbackOf: versionId };
  }

  saveSettings(payload, actor = {}) {
    const normalized = this.normalizeSettings(payload || {});
    if (!normalized.siteSettings.siteTitle.trim() || !normalized.siteSettings.supportEmail.includes('@')) {
      return { ok: false, error: { code: 'SETTINGS_VALIDATION_ERROR', message: 'Invalid settings payload.' } };
    }

    const brandMedia = normalized.siteSettings.brandMedia;
    if (brandMedia.logo && !this.isValidMediaLink(brandMedia.logo)) {
      return { ok: false, error: { code: 'SETTINGS_VALIDATION_ERROR', message: 'Invalid logo media reference.' } };
    }
    if (brandMedia.logoDark && !this.isValidMediaLink(brandMedia.logoDark)) {
      return { ok: false, error: { code: 'SETTINGS_VALIDATION_ERROR', message: 'Invalid dark logo media reference.' } };
    }
    if (brandMedia.favicon && !this.isValidMediaLink(brandMedia.favicon)) {
      return { ok: false, error: { code: 'SETTINGS_VALIDATION_ERROR', message: 'Invalid favicon media reference.' } };
    }
    if (brandMedia.defaultSocialImage && !this.isValidMediaLink(brandMedia.defaultSocialImage)) {
      return { ok: false, error: { code: 'SETTINGS_VALIDATION_ERROR', message: 'Invalid default social image media reference.' } };
    }

    const previous = this.getSettings();
    const diff = this.buildSettingsDiff(previous, normalized);
    const state = this.readState();
    state.settings = normalized;
    state.settingsHistory = [
      {
        versionId: `settings-${Date.now()}`,
        changedAt: new Date().toISOString(),
        changedBy: typeof actor?.changedBy === 'string' && actor.changedBy.trim() ? actor.changedBy.trim() : 'unknown',
        changedFields: diff.changedFields,
        changeSummary: diff.changeSummary,
        snapshot: normalized,
      },
      ...(Array.isArray(state.settingsHistory) ? state.settingsHistory : []),
    ].slice(0, 100);
    this.writeState(state);
    return { ok: true, settings: normalized, audit: diff };
  }

  getSyncDiagnostics() {
    const invalidMediaReferences = this.collectAllMediaReferences().filter((entry) => !entry.isValid);
    const settings = this.getSettings();

    return {
      mode: 'authoritative_remote',
      instantPublishingEnabled: settings.operationalSettings.instantPublishing,
      invalidMediaReferences,
      summary: {
        invalidMediaReferenceCount: invalidMediaReferences.length,
        blogCount: this.listBlogPosts().length,
        projectCount: this.listProjects().length,
        serviceCount: this.listServices().length,
        mediaCount: this.listMediaFiles().length,
      },
    };
  }

  getContentHealthSummary() {
    const blogPosts = this.listBlogPosts();
    const projects = this.listProjects();
    const services = this.listServices();
    const mediaFiles = this.listMediaFiles();
    const settings = this.getSettings();

    const seoIncompleteBlog = blogPosts.filter((post) => post.status === 'published' && (!post.seo?.title || !post.seo?.description || !post.seo?.canonicalSlug)).length;
    const seoIncompleteProjects = projects.filter((project) => project.status === 'published' && (!project.seo?.title || !project.seo?.description || !project.seo?.canonicalSlug)).length;
    const seoIncompleteServices = services.filter((service) => service.status === 'published' && (!service.seo?.title || !service.seo?.description || !service.seo?.canonicalSlug)).length;

    const missingPublishedMedia = {
      blog: blogPosts.filter((post) => post.status === 'published' && !post.mediaRoles?.coverImage).length,
      projects: projects.filter((project) => project.status === 'published' && (!project.mediaRoles?.cardImage || !project.mediaRoles?.heroImage)).length,
      services: services.filter((service) => service.status === 'published' && !service.iconLikeAsset).length,
    };

    const invalidServiceRoutes = services.filter((service) => !SLUG_PATTERN.test(service.routeSlug || '')).length;
    const mediaMissingAlt = mediaFiles.filter((asset) => !asset.alt || !asset.alt.trim()).length;
    const missingBrandAssets = ['logo', 'logoDark', 'favicon', 'defaultSocialImage'].filter((field) => !settings.siteSettings.brandMedia?.[field]).length;
    const routeCollisions = this.collectRouteCollisions(services);
    const unresolvedMediaReferences = this.collectAllMediaReferences().filter((entry) => !entry.isValid);
    const legacyFieldUsage = {
      blog: blogPosts.filter((post) => post.featuredImage && !post.mediaRoles?.coverImage).length,
      projects: projects.filter((project) => (project.featuredImage || project.mainImage) && !project.mediaRoles?.cardImage).length,
      services: services.filter((service) => !service.routeSlug || service.routeSlug === service.slug).length,
    };

    const readinessDiagnostics = {
      blog: blogPosts.map((post) => ({
        id: post.id,
        label: post.title,
        status: post.status,
        issues: this.getBlogReadinessIssues(post),
      })),
      projects: projects.map((project) => ({
        id: project.id,
        label: project.title,
        status: project.status,
        issues: this.getProjectReadinessIssues(project),
      })),
      services: services.map((service) => ({
        id: service.id,
        label: service.title,
        status: service.status,
        issues: this.getServiceReadinessIssues(service),
      })),
    };

    const blockerDiagnostics = [...readinessDiagnostics.blog, ...readinessDiagnostics.projects, ...readinessDiagnostics.services]
      .filter((entry) => entry.issues.some((issue) => issue.severity === 'blocker'));
    const warningDiagnostics = [...readinessDiagnostics.blog, ...readinessDiagnostics.projects, ...readinessDiagnostics.services]
      .filter((entry) => entry.issues.some((issue) => issue.severity === 'warning'));

    return {
      publication: {
        blog: this.countByStatus(blogPosts),
        projects: this.countByStatus(projects),
        services: this.countByStatus(services),
      },
      quality: {
        missingPublishedMedia,
        seoIncomplete: {
          blog: seoIncompleteBlog,
          projects: seoIncompleteProjects,
          services: seoIncompleteServices,
        },
        invalidServiceRoutes,
        routeCollisions: routeCollisions.length,
        unresolvedMediaReferences: unresolvedMediaReferences.length,
        legacyFieldUsage,
        mediaMissingAlt,
        missingBrandAssets,
      },
      launchReadiness: {
        blockers: [
          missingPublishedMedia.blog + missingPublishedMedia.projects + missingPublishedMedia.services > 0 ? 'published_content_missing_media' : null,
          seoIncompleteBlog + seoIncompleteProjects + seoIncompleteServices > 0 ? 'published_content_missing_seo' : null,
          invalidServiceRoutes > 0 ? 'invalid_service_routes' : null,
          routeCollisions.length > 0 ? 'service_route_collisions' : null,
          unresolvedMediaReferences.length > 0 ? 'unresolved_media_references' : null,
          missingBrandAssets > 0 ? 'missing_brand_assets' : null,
        ].filter(Boolean),
        summary: {
          blockerCount: blockerDiagnostics.length,
          warningCount: warningDiagnostics.length,
          publishReadyCount:
            readinessDiagnostics.blog.filter((entry) => entry.status === 'published' && entry.issues.every((issue) => issue.severity !== 'blocker')).length +
            readinessDiagnostics.projects.filter((entry) => entry.status === 'published' && entry.issues.every((issue) => issue.severity !== 'blocker')).length +
            readinessDiagnostics.services.filter((entry) => entry.status === 'published' && entry.issues.every((issue) => issue.severity !== 'blocker')).length,
          publishedCount:
            readinessDiagnostics.blog.filter((entry) => entry.status === 'published').length +
            readinessDiagnostics.projects.filter((entry) => entry.status === 'published').length +
            readinessDiagnostics.services.filter((entry) => entry.status === 'published').length,
        },
        topIssues: blockerDiagnostics.concat(warningDiagnostics).slice(0, 8).map((entry) => ({
          id: entry.id,
          label: entry.label,
          status: entry.status,
          issues: entry.issues.slice(0, 3),
        })),
      },
      mediaRolePresets: Array.from(MEDIA_ROLE_PRESETS),
    };
  }

  countByStatus(entries) {
    return entries.reduce((acc, entry) => {
      const status = entry.status || 'draft';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { draft: 0, in_review: 0, published: 0, archived: 0 });
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
    if (!hasMinTrimmedLength(summarySource, 24)) {
      return { ok: false, message: 'Summary/description must contain at least 24 characters.' };
    }
    return { ok: true };
  }

  evaluateServicePublishability(service) {
    const blockers = this.getServiceReadinessIssues(service).filter((issue) => issue.severity === 'blocker');
    if (blockers.length > 0) {
      return { ok: false, message: blockers[0].message };
    }
    return { ok: true };
  }

  getBlogReadinessIssues(post) {
    const issues = [];
    if (post.status !== 'published') return issues;
    if (!post.title?.trim() || !post.slug?.trim() || !post.featuredImage?.trim()) {
      issues.push({ severity: 'blocker', code: 'blog_missing_required_publish_fields', message: 'Article publié sans titre/slug/image vedette complète.' });
    }
    if (!this.isValidDate(post.publishedDate)) {
      issues.push({ severity: 'blocker', code: 'blog_invalid_publish_date', message: 'Date de publication blog invalide.' });
    }
    if (!this.isValidMediaLink(post.featuredImage)) {
      issues.push({ severity: 'blocker', code: 'blog_invalid_featured_media', message: 'Image vedette blog invalide (URL ou media:asset-id attendu).' });
    }
    if (!post.seo?.title || !post.seo?.description || !post.seo?.canonicalSlug) {
      issues.push({ severity: 'warning', code: 'blog_seo_incomplete', message: 'SEO blog incomplet (title/description/canonicalSlug).' });
    }
    if (!post.seo?.socialImage && !post.mediaRoles?.socialImage) {
      issues.push({ severity: 'warning', code: 'blog_missing_social_image', message: 'Aucune image sociale explicite pour le blog.' });
    }
    if (post.featuredImage && !post.mediaRoles?.coverImage) {
      issues.push({ severity: 'warning', code: 'blog_legacy_media_field', message: 'Article blog reposant sur featuredImage legacy sans mediaRoles.coverImage.' });
    }
    return issues;
  }

  getProjectReadinessIssues(project) {
    const issues = [];
    if (project.status !== 'published') return issues;
    if (!project.title?.trim() || !project.slug?.trim() || !project.featuredImage?.trim()) {
      issues.push({ severity: 'blocker', code: 'project_missing_required_publish_fields', message: 'Projet publié sans titre/slug/image carte complète.' });
    }
    if (!this.isValidMediaLink(project.featuredImage)) {
      issues.push({ severity: 'blocker', code: 'project_invalid_featured_media', message: 'Image carte projet invalide.' });
    }
    const summarySource = typeof project.summary === 'string' && project.summary.trim()
      ? project.summary.trim()
      : `${project.description || ''}`.trim();
    if (!hasMinTrimmedLength(summarySource, 24)) {
      issues.push({ severity: 'blocker', code: 'project_summary_too_short', message: 'Résumé/description projet insuffisant pour la publication.' });
    }
    if (!project.mediaRoles?.cardImage || !project.mediaRoles?.heroImage) {
      issues.push({ severity: 'warning', code: 'project_missing_media_roles', message: 'Projet sans mediaRoles cardImage/heroImage complets.' });
    }
    if (!project.seo?.title || !project.seo?.description || !project.seo?.canonicalSlug) {
      issues.push({ severity: 'warning', code: 'project_seo_incomplete', message: 'SEO projet incomplet (title/description/canonicalSlug).' });
    }
    if ((project.featuredImage || project.mainImage) && !project.mediaRoles?.cardImage) {
      issues.push({ severity: 'warning', code: 'project_legacy_media_field', message: 'Projet s’appuie sur featuredImage/mainImage legacy.' });
    }
    return issues;
  }

  getServiceReadinessIssues(service) {
    const issues = [];
    if (service.status !== 'published') return issues;
    if (!service.routeSlug || !isValidSlug(service.routeSlug)) {
      issues.push({ severity: 'blocker', code: 'service_invalid_route_slug', message: 'Service publié avec routeSlug invalide.' });
    }
    if (!service.description?.trim() || !Array.isArray(service.features) || service.features.length === 0) {
      issues.push({ severity: 'blocker', code: 'service_missing_core_fields', message: 'Service publié sans description/fonctionnalités complètes.' });
    }
    if (service.ctaPrimaryHref && !isValidContentHrefContract(service.ctaPrimaryHref)) {
      issues.push({ severity: 'blocker', code: 'service_invalid_cta_href', message: 'CTA principal service invalide (ancre, route ou URL https).' });
    }
    if (!service.iconLikeAsset) {
      issues.push({ severity: 'warning', code: 'service_missing_icon_asset', message: 'Service sans iconLikeAsset explicite pour les surfaces CMS.' });
    }
    if (!service.seo?.title || !service.seo?.description || !service.seo?.canonicalSlug) {
      issues.push({ severity: 'warning', code: 'service_seo_incomplete', message: 'SEO service incomplet (title/description/canonicalSlug).' });
    }
    if (service.ctaPrimaryLabel && !service.ctaPrimaryHref) {
      issues.push({ severity: 'warning', code: 'service_partial_cta', message: 'Service avec label CTA sans lien correspondant.' });
    }
    return issues;
  }

  collectRouteCollisions(services) {
    const bySlug = new Map();
    services.forEach((service) => {
      const slug = `${service.routeSlug || ''}`.trim();
      if (!slug) return;
      const entries = bySlug.get(slug) || [];
      entries.push(service.id);
      bySlug.set(slug, entries);
    });
    return Array.from(bySlug.entries()).filter(([, ids]) => ids.length > 1).map(([slug, ids]) => ({ slug, ids }));
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

    const canonicalSlug = this.normalizeSlug((raw?.seo && raw.seo.canonicalSlug) || slug || title || 'article');
    const featuredImage = typeof raw?.featuredImage === 'string' && raw.featuredImage.trim() ? raw.featuredImage.trim() : 'blog article image';
    const socialImage =
      (raw?.mediaRoles && typeof raw.mediaRoles.socialImage === 'string' && raw.mediaRoles.socialImage.trim()) ||
      (raw?.seo && typeof raw.seo.socialImage === 'string' && raw.seo.socialImage.trim()) ||
      featuredImage;

    return {
      ...raw,
      status,
      title,
      slug,
      excerpt: excerpt || (content ? content.slice(0, 160) : `Résumé à compléter pour ${title || 'cet article'}.`),
      content: content || 'Contenu à compléter.',
      author: typeof raw?.author === 'string' && raw.author.trim() ? raw.author.trim() : 'Équipe SMOVE',
      authorRole: typeof raw?.authorRole === 'string' && raw.authorRole.trim() ? raw.authorRole.trim() : 'CMS Editor',
      category: this.normalizeBlogCategory(raw?.category),
      tags: this.normalizeBlogTags(raw?.tags),
      publishedDate: this.isValidDate(raw?.publishedDate) ? new Date(raw.publishedDate).toISOString() : new Date().toISOString(),
      readTime: typeof raw?.readTime === 'string' && raw.readTime.trim() ? raw.readTime.trim() : '5 min',
      featuredImage,
      images: Array.isArray(raw?.images) ? raw.images.map((entry) => `${entry}`.trim()).filter(Boolean) : [],
      seo: {
        title: (raw?.seo?.title || title).trim() || title || 'Article SMOVE',
        description: (raw?.seo?.description || excerpt || content.slice(0, 160)).trim() || `Article ${title || 'SMOVE'}`,
        canonicalSlug,
        socialImage,
        noIndex: Boolean(raw?.seo?.noIndex),
        canonicalUrl: typeof raw?.seo?.canonicalUrl === 'string' ? raw.seo.canonicalUrl.trim() : '',
      },
      mediaRoles: {
        featuredImage,
        coverImage: (raw?.mediaRoles?.coverImage || featuredImage || '').trim(),
        cardImage: (raw?.mediaRoles?.cardImage || featuredImage || '').trim(),
        socialImage,
      },
    };
  }

  isValidDate(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    return !Number.isNaN(Date.parse(value));
  }

  isValidHttpUrl(value) {
    return isHttpUrl(value);
  }

  isValidContentHref(value) {
    return isValidContentHrefContract(value);
  }

  isMediaReference(value) {
    return isMediaReferenceContract(value);
  }

  mediaIdFromReference(value) {
    return mediaIdFromReferenceContract(value);
  }

  doesMediaReferenceExist(value) {
    if (!this.isMediaReference(value)) return false;
    const mediaId = this.mediaIdFromReference(value);
    if (!mediaId) return false;
    return this.listMediaFiles().some((entry) => entry.id === mediaId);
  }

  isValidMediaLink(value) {
    return isValidMediaFieldValue(value, {
      allowInlineText: true,
      hasMediaById: (mediaId) => this.listMediaFiles().some((entry) => entry.id === mediaId),
    });
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
          (post.seo.socialImage === undefined || this.isValidMediaLink(post.seo.socialImage)) &&
          (post.seo.canonicalSlug === undefined || isValidSlug(post.seo.canonicalSlug)))) &&
      (post.mediaRoles === undefined ||
        (typeof post.mediaRoles === 'object' &&
          (post.mediaRoles.featuredImage === undefined || this.isValidMediaLink(post.mediaRoles.featuredImage)) &&
          (post.mediaRoles.socialImage === undefined || this.isValidMediaLink(post.mediaRoles.socialImage)) &&
          (post.mediaRoles.coverImage === undefined || this.isValidMediaLink(post.mediaRoles.coverImage)) &&
          (post.mediaRoles.cardImage === undefined || this.isValidMediaLink(post.mediaRoles.cardImage)))) &&
      isValidSlug(post.slug) &&
      BLOG_STATUSES.has(post.status)
    );
  }

  normalizeProject(project) {
    const asTrimmedString = requiredTrimmed;
    const title = asTrimmedString(project?.title);
    const slug = this.normalizeSlug(asTrimmedString(project?.slug) || title || asTrimmedString(project?.id));
    const status = PROJECT_STATUSES.has(project?.status) ? project.status : 'published';
    const nowIso = new Date().toISOString();

    const roleCardImage = asTrimmedString(project?.mediaRoles?.cardImage);
    const roleHeroImage = asTrimmedString(project?.mediaRoles?.heroImage);
    const roleCoverImage = asTrimmedString(project?.mediaRoles?.coverImage);
    const roleSocialImage = asTrimmedString(project?.mediaRoles?.socialImage);
    const roleGalleryImages = Array.isArray(project?.mediaRoles?.galleryImages) ? normalizeStringArray(project.mediaRoles.galleryImages) : [];
    const featuredImage = roleCardImage || asTrimmedString(project?.featuredImage) || asTrimmedString(project?.mainImage) || 'project cover image';
    const heroImage = roleHeroImage || asTrimmedString(project?.mainImage) || featuredImage;
    const liveLink =
      asTrimmedString(project?.links?.live) ||
      asTrimmedString(project?.link) ||
      asTrimmedString(project?.externalLink);
    const caseStudyLink =
      asTrimmedString(project?.links?.caseStudy) ||
      asTrimmedString(project?.caseStudyLink);

    const canonicalSlug = this.normalizeSlug(asTrimmedString(project?.seo?.canonicalSlug) || slug || title);

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
      results: normalizeStringArray(project?.results),
      tags: normalizeStringArray(project?.tags),
      mainImage: heroImage,
      featuredImage,
      imageAlt: asTrimmedString(project?.imageAlt) || title || 'Projet SMOVE',
      images: Array.isArray(project?.images)
        ? normalizeStringArray(project.images)
        : heroImage
          ? [heroImage]
          : [],
      mediaRoles: {
        cardImage: featuredImage,
        heroImage,
        coverImage: roleCoverImage || heroImage || featuredImage,
        socialImage: roleSocialImage || featuredImage,
        galleryImages: roleGalleryImages.length > 0
          ? roleGalleryImages
          : Array.isArray(project?.images)
            ? normalizeStringArray(project.images)
            : heroImage
              ? [heroImage]
              : [],
      },
      seo: {
        title: asTrimmedString(project?.seo?.title) || title || 'Projet SMOVE',
        description: asTrimmedString(project?.seo?.description) || asTrimmedString(project?.summary) || asTrimmedString(project?.description) || 'Projet SMOVE',
        canonicalSlug,
        socialImage: roleSocialImage || featuredImage,
      },
      featured: Boolean(project?.featured),
      status,
      reviewedAt: typeof project?.reviewedAt === 'string' ? project.reviewedAt : undefined,
      reviewedBy: typeof project?.reviewedBy === 'string' ? project.reviewedBy.trim() || undefined : undefined,
      createdAt: project?.createdAt || nowIso,
      updatedAt: nowIso,
      link: liveLink || undefined,
      links: liveLink || caseStudyLink
        ? {
            live: liveLink || undefined,
            caseStudy: caseStudyLink || undefined,
          }
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
        isValidSlug(project.slug) &&
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
            (project.mediaRoles.coverImage === undefined || this.isValidMediaLink(project.mediaRoles.coverImage)) &&
            (project.mediaRoles.socialImage === undefined || this.isValidMediaLink(project.mediaRoles.socialImage)) &&
            (project.mediaRoles.galleryImages === undefined || (Array.isArray(project.mediaRoles.galleryImages) && project.mediaRoles.galleryImages.every((image) => this.isValidMediaLink(image)))))) &&
        (project.seo === undefined ||
          (typeof project.seo === 'object' &&
            (project.seo.title === undefined || typeof project.seo.title === 'string') &&
            (project.seo.description === undefined || typeof project.seo.description === 'string') &&
            (project.seo.canonicalSlug === undefined || isValidSlug(project.seo.canonicalSlug)) &&
            (project.seo.socialImage === undefined || this.isValidMediaLink(project.seo.socialImage)))) &&
        (project.link === undefined || isValidOptionalHttpUrl(project.link)) &&
        (project.links === undefined ||
          (typeof project.links === 'object' &&
            (project.links.live === undefined || isValidOptionalHttpUrl(project.links.live)) &&
            (project.links.caseStudy === undefined || isValidOptionalHttpUrl(project.links.caseStudy)))) &&
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
    const asTrimmedString = requiredTrimmed;
    const title = asTrimmedString(service?.title);
    const nowIso = new Date().toISOString();
    const routeSlug = this.normalizeSlug(asTrimmedString(service?.routeSlug) || asTrimmedString(service?.slug) || title || asTrimmedString(service?.id));
    const canonicalSlug = this.normalizeSlug(asTrimmedString(service?.seo?.canonicalSlug) || routeSlug || asTrimmedString(service?.slug) || title || asTrimmedString(service?.id));

    return {
      ...service,
      id: asTrimmedString(service?.id),
      title,
      slug: this.normalizeSlug(asTrimmedString(service?.slug) || title || asTrimmedString(service?.id)),
      description: asTrimmedString(service?.description),
      shortDescription: asTrimmedString(service?.shortDescription) || undefined,
      icon: asTrimmedString(service?.icon) || 'palette',
      iconLikeAsset: asTrimmedString(service?.iconLikeAsset) || undefined,
      routeSlug,
      overviewTitle: asTrimmedString(service?.overviewTitle) || undefined,
      overviewDescription: asTrimmedString(service?.overviewDescription) || undefined,
      ctaTitle: asTrimmedString(service?.ctaTitle) || undefined,
      ctaDescription: asTrimmedString(service?.ctaDescription) || undefined,
      ctaPrimaryLabel: asTrimmedString(service?.ctaPrimaryLabel) || undefined,
      ctaPrimaryHref: asTrimmedString(service?.ctaPrimaryHref) || undefined,
      processTitle: asTrimmedString(service?.processTitle) || undefined,
      processSteps: normalizeStringArray(service?.processSteps),
      color: asTrimmedString(service?.color) || 'from-[#00b3e8] to-[#00c0e8]',
      features: normalizeStringArray(service?.features),
      status: SERVICE_STATUSES.has(service?.status) ? service.status : 'published',
      featured: Boolean(service?.featured),
      seo: {
        title: asTrimmedString(service?.seo?.title) || title || 'Service SMOVE',
        description: asTrimmedString(service?.seo?.description) || asTrimmedString(service?.shortDescription) || asTrimmedString(service?.description) || 'Service SMOVE',
        canonicalSlug,
        socialImage: asTrimmedString(service?.seo?.socialImage) || asTrimmedString(service?.iconLikeAsset) || undefined,
      },
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
        isValidSlug(service.slug) &&
        typeof service.routeSlug === 'string' &&
        service.routeSlug.length > 0 &&
        isValidSlug(service.routeSlug) &&
        (service.iconLikeAsset === undefined || this.isValidMediaLink(service.iconLikeAsset)) &&
        (service.seo === undefined ||
          (typeof service.seo === 'object' &&
            (service.seo.title === undefined || typeof service.seo.title === 'string') &&
            (service.seo.description === undefined || typeof service.seo.description === 'string') &&
            (service.seo.canonicalSlug === undefined || isValidSlug(service.seo.canonicalSlug)) &&
            (service.seo.socialImage === undefined || this.isValidMediaLink(service.seo.socialImage)))) &&
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
        SERVICE_STATUSES.has(service.status) &&
        (service.processTitle === undefined || typeof service.processTitle === 'string') &&
        (service.processSteps === undefined || (Array.isArray(service.processSteps) && service.processSteps.every((step) => typeof step === 'string' && step.trim().length > 0)))
    );
  }

  normalizeSlug(input) {
    return normalizeSharedSlug(input);
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
      metadata: {
        ...(file?.metadata && typeof file.metadata === 'object' ? file.metadata : {}),
        license: typeof file?.metadata?.license === 'string' ? file.metadata.license.trim() : '',
        focalPoint: typeof file?.metadata?.focalPoint === 'string' ? file.metadata.focalPoint.trim() : '',
      },
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
      this.isValidContentHref(home.heroPrimaryCtaHref) &&
      this.isValidContentHref(home.heroSecondaryCtaHref) &&
      this.isValidContentHref(home.aboutCtaHref) &&
      this.isValidContentHref(home.portfolioCtaHref) &&
      this.isValidContentHref(home.blogCtaHref) &&
      (!home.aboutImage || this.isValidMediaLink(home.aboutImage));
  }

  findMediaReferences(mediaId) {
    const mediaRef = `${MEDIA_REFERENCE_PREFIX}${mediaId}`;
    return this.collectAllMediaReferences().filter((entry) => entry.value === mediaRef);
  }

  collectAllMediaReferences() {
    const references = [];
    const activeMediaIds = new Set(this.listMediaFiles({ includeArchived: true }).filter((entry) => !entry.archivedAt).map((entry) => entry.id));

    const register = (value, payload) => {
      if (typeof value !== 'string') return;
      const trimmed = value.trim();
      if (!trimmed.startsWith(MEDIA_REFERENCE_PREFIX)) return;
      const mediaId = this.mediaIdFromReference(trimmed);
      if (!mediaId) return;
      references.push({
        ...payload,
        value: trimmed,
        mediaId,
        isValid: activeMediaIds.has(mediaId),
      });
    };

    this.listBlogPosts().forEach((post) => {
      register(post.featuredImage, { domain: 'blog', id: post.id, field: 'featuredImage', label: post.title });
      register(post.mediaRoles?.featuredImage, { domain: 'blog', id: post.id, field: 'mediaRoles.featuredImage', label: post.title });
      register(post.seo?.socialImage, { domain: 'blog', id: post.id, field: 'seo.socialImage', label: post.title });
      register(post.mediaRoles?.socialImage, { domain: 'blog', id: post.id, field: 'mediaRoles.socialImage', label: post.title });
      register(post.mediaRoles?.coverImage, { domain: 'blog', id: post.id, field: 'mediaRoles.coverImage', label: post.title });
      register(post.mediaRoles?.cardImage, { domain: 'blog', id: post.id, field: 'mediaRoles.cardImage', label: post.title });
      (Array.isArray(post.images) ? post.images : []).forEach((image, index) => register(image, { domain: 'blog', id: post.id, field: `images[${index}]`, label: post.title }));
    });

    this.listProjects().forEach((project) => {
      register(project.featuredImage, { domain: 'project', id: project.id, field: 'featuredImage', label: project.title });
      register(project.mainImage, { domain: 'project', id: project.id, field: 'mainImage', label: project.title });
      (Array.isArray(project.images) ? project.images : []).forEach((image, index) => register(image, { domain: 'project', id: project.id, field: `images[${index}]`, label: project.title }));
      register(project.mediaRoles?.cardImage, { domain: 'project', id: project.id, field: 'mediaRoles.cardImage', label: project.title });
      register(project.mediaRoles?.heroImage, { domain: 'project', id: project.id, field: 'mediaRoles.heroImage', label: project.title });
      register(project.mediaRoles?.coverImage, { domain: 'project', id: project.id, field: 'mediaRoles.coverImage', label: project.title });
      register(project.mediaRoles?.socialImage, { domain: 'project', id: project.id, field: 'mediaRoles.socialImage', label: project.title });
      (project.mediaRoles?.galleryImages || []).forEach((image, index) => register(image, { domain: 'project', id: project.id, field: `mediaRoles.galleryImages[${index}]`, label: project.title }));
    });

    this.listServices().forEach((service) => {
      register(service.iconLikeAsset, { domain: 'service', id: service.id, field: 'iconLikeAsset', label: service.title });
      register(service.seo?.socialImage, { domain: 'service', id: service.id, field: 'seo.socialImage', label: service.title });
    });

    const home = this.getPageContent().home;
    register(home.aboutImage, { domain: 'home', id: 'home', field: 'aboutImage', label: 'Home page' });

    const settings = this.getSettings();
    register(settings.siteSettings.brandMedia.logo, { domain: 'settings', id: 'global', field: 'siteSettings.brandMedia.logo', label: 'Site settings' });
    register(settings.siteSettings.brandMedia.logoDark, { domain: 'settings', id: 'global', field: 'siteSettings.brandMedia.logoDark', label: 'Site settings' });
    register(settings.siteSettings.brandMedia.favicon, { domain: 'settings', id: 'global', field: 'siteSettings.brandMedia.favicon', label: 'Site settings' });
    register(settings.siteSettings.brandMedia.defaultSocialImage, { domain: 'settings', id: 'global', field: 'siteSettings.brandMedia.defaultSocialImage', label: 'Site settings' });

    return references;
  }

  normalizeSettings(settings) {
    const siteSettingsCandidate = settings?.siteSettings && typeof settings.siteSettings === 'object' ? settings.siteSettings : settings;
    const operationalSettingsCandidate = settings?.operationalSettings && typeof settings.operationalSettings === 'object' ? settings.operationalSettings : settings;
    const taxonomySettingsCandidate = settings?.taxonomySettings && typeof settings.taxonomySettings === 'object'
      ? settings.taxonomySettings
      : settings?.taxonomy && typeof settings.taxonomy === 'object'
        ? settings.taxonomy
        : {};

    const normalizedSiteTitle =
      typeof siteSettingsCandidate?.siteTitle === 'string'
        ? siteSettingsCandidate.siteTitle.trim() || defaultSettings.siteSettings.siteTitle
        : defaultSettings.siteSettings.siteTitle;
    const normalizedSupportEmail =
      typeof siteSettingsCandidate?.supportEmail === 'string'
        ? siteSettingsCandidate.supportEmail.trim() || defaultSettings.siteSettings.supportEmail
        : defaultSettings.siteSettings.supportEmail;
    const normalizedInstantPublishing =
      typeof operationalSettingsCandidate?.instantPublishing === 'boolean'
        ? operationalSettingsCandidate.instantPublishing
        : defaultSettings.operationalSettings.instantPublishing;

    const normalized = {
      siteSettings: {
        siteTitle: normalizedSiteTitle,
        supportEmail: normalizedSupportEmail,
        brandMedia: {
          logo: typeof siteSettingsCandidate?.brandMedia?.logo === 'string' ? siteSettingsCandidate.brandMedia.logo.trim() : '',
          logoDark: typeof siteSettingsCandidate?.brandMedia?.logoDark === 'string' ? siteSettingsCandidate.brandMedia.logoDark.trim() : '',
          favicon: typeof siteSettingsCandidate?.brandMedia?.favicon === 'string' ? siteSettingsCandidate.brandMedia.favicon.trim() : '',
          defaultSocialImage:
            typeof siteSettingsCandidate?.brandMedia?.defaultSocialImage === 'string' ? siteSettingsCandidate.brandMedia.defaultSocialImage.trim() : '',
        },
      },
      operationalSettings: {
        instantPublishing: normalizedInstantPublishing,
      },
      taxonomySettings: {
        blog: {
          managedCategories: this.normalizeManagedTaxonomyList(taxonomySettingsCandidate?.blog?.managedCategories, MANAGED_BLOG_CATEGORIES),
          managedTags: this.normalizeManagedTaxonomyList(taxonomySettingsCandidate?.blog?.managedTags, MANAGED_BLOG_TAGS),
          enforceManagedTags: taxonomySettingsCandidate?.blog?.enforceManagedTags !== false,
        },
      },
    };

    return {
      ...normalized,
      // Backward-compat aliases for legacy clients and historical snapshots.
      siteTitle: normalized.siteSettings.siteTitle,
      supportEmail: normalized.siteSettings.supportEmail,
      instantPublishing: normalized.operationalSettings.instantPublishing,
      taxonomy: normalized.taxonomySettings,
    };
  }

  normalizeManagedTaxonomyList(candidate, fallback) {
    const source = Array.isArray(candidate) ? candidate : fallback;
    const seen = new Set();
    const normalized = [];

    source.forEach((entry) => {
      const value = `${entry || ''}`.trim();
      if (!value) return;
      const key = value.toLocaleLowerCase('fr');
      if (seen.has(key)) return;
      seen.add(key);
      normalized.push(value);
    });

    return normalized.length > 0 ? normalized : fallback;
  }

  normalizeBlogCategory(rawCategory) {
    const input = typeof rawCategory === 'string' ? rawCategory.trim() : '';
    if (!input) return 'Non classé';

    const taxonomy = this.getBlogTaxonomy();
    const match = taxonomy.managedCategories.find((category) => category.toLocaleLowerCase('fr') === input.toLocaleLowerCase('fr'));
    return match || input;
  }

  normalizeBlogTags(rawTags) {
    const tagList = Array.isArray(rawTags)
      ? rawTags.map((tag) => `${tag}`.trim()).filter(Boolean)
      : typeof rawTags === 'string'
        ? rawTags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];
    const taxonomy = this.getBlogTaxonomy();
    const seen = new Set();
    const normalized = [];

    tagList.forEach((tag) => {
      const managed = taxonomy.managedTags.find((entry) => entry.toLocaleLowerCase('fr') === tag.toLocaleLowerCase('fr'));
      const next = managed || (taxonomy.enforceManagedTags ? '' : tag);
      if (!next) return;
      const key = next.toLocaleLowerCase('fr');
      if (seen.has(key)) return;
      seen.add(key);
      normalized.push(next);
    });

    return normalized;
  }

  buildSettingsDiff(previous, next) {
    const changedFields = [];
    const register = (field, before, after) => {
      if ((before || '') !== (after || '')) changedFields.push(field);
    };

    register('siteSettings.siteTitle', previous.siteSettings.siteTitle, next.siteSettings.siteTitle);
    register('siteSettings.supportEmail', previous.siteSettings.supportEmail, next.siteSettings.supportEmail);
    register('siteSettings.brandMedia.logo', previous.siteSettings.brandMedia.logo, next.siteSettings.brandMedia.logo);
    register('siteSettings.brandMedia.logoDark', previous.siteSettings.brandMedia.logoDark, next.siteSettings.brandMedia.logoDark);
    register('siteSettings.brandMedia.favicon', previous.siteSettings.brandMedia.favicon, next.siteSettings.brandMedia.favicon);
    register('siteSettings.brandMedia.defaultSocialImage', previous.siteSettings.brandMedia.defaultSocialImage, next.siteSettings.brandMedia.defaultSocialImage);
    if (previous.operationalSettings.instantPublishing !== next.operationalSettings.instantPublishing) {
      changedFields.push('operationalSettings.instantPublishing');
    }

    return {
      changedFields,
      changeSummary: changedFields.length > 0 ? `Updated ${changedFields.length} field(s).` : 'No effective changes detected.',
    };
  }
}

module.exports = { ContentService };
