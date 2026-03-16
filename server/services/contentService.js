const BLOG_STATUSES = new Set(['draft', 'in_review', 'published', 'archived']);
const MEDIA_TYPES = new Set(['image', 'video', 'document']);
const PROJECT_STATUSES = new Set(['draft', 'published', 'archived']);
const SERVICE_STATUSES = new Set(['draft', 'published', 'archived']);

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

    const index = projects.findIndex((entry) => entry.id === normalized.id);
    if (index >= 0) projects[index] = normalized;
    else projects.push(normalized);
    state.projects = projects;
    this.writeState(state);
    return { ok: true, project: normalized };
  }

  deleteProject(id) {
    const state = this.readState();
    state.projects = this.listProjects().filter((entry) => entry.id !== id);
    this.writeState(state);
    return { ok: true };
  }


  listServices() {
    return (this.readState().services || [])
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
    if (!post.title?.trim() || !post.slug?.trim() || !post.featuredImage?.trim() || !post.content?.trim() || !post.excerpt?.trim()) {
      return { ok: false, message: 'Missing required publish fields.' };
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
    return { ...raw, status };
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
      typeof post.publishedDate === 'string' &&
      typeof post.readTime === 'string' &&
      typeof post.featuredImage === 'string' &&
      post.featuredImage.trim().length > 0 &&
      Array.isArray(post.images) &&
      BLOG_STATUSES.has(post.status)
    );
  }

  normalizeProject(project) {
    const asTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');
    const title = asTrimmedString(project?.title);
    const slug = this.normalizeSlug(asTrimmedString(project?.slug) || title || asTrimmedString(project?.id));
    const status = PROJECT_STATUSES.has(project?.status) ? project.status : 'published';
    const nowIso = new Date().toISOString();

    const featuredImage = asTrimmedString(project?.featuredImage) || asTrimmedString(project?.mainImage) || 'project cover image';

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
      mainImage: featuredImage,
      featuredImage,
      imageAlt: asTrimmedString(project?.imageAlt) || title || 'Projet SMOVE',
      images: Array.isArray(project?.images)
        ? project.images.map((entry) => `${entry}`.trim()).filter(Boolean)
        : featuredImage
          ? [featuredImage]
          : [],
      featured: Boolean(project?.featured),
      status,
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
        typeof project.client === 'string' &&
        project.client.length > 0 &&
        typeof project.category === 'string' &&
        project.category.length > 0 &&
        typeof project.year === 'string' &&
        typeof project.description === 'string' &&
        project.description.length > 0 &&
        typeof project.challenge === 'string' &&
        project.challenge.length > 0 &&
        typeof project.solution === 'string' &&
        project.solution.length > 0 &&
        Array.isArray(project.results) &&
        Array.isArray(project.tags) &&
        typeof project.mainImage === 'string' &&
        project.mainImage.length > 0 &&
        typeof project.featuredImage === 'string' &&
        project.featuredImage.length > 0 &&
        typeof project.imageAlt === 'string' &&
        (project.link === undefined || typeof project.link === 'string') &&
        (project.links === undefined ||
          (typeof project.links === 'object' &&
            (project.links.live === undefined || typeof project.links.live === 'string') &&
            (project.links.caseStudy === undefined || typeof project.links.caseStudy === 'string'))) &&
        (project.testimonial === undefined ||
          (typeof project.testimonial === 'object' &&
            typeof project.testimonial.text === 'string' &&
            typeof project.testimonial.author === 'string' &&
            typeof project.testimonial.position === 'string')) &&
        Array.isArray(project.images) &&
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
        typeof service.description === 'string' &&
        service.description.length > 0 &&
        typeof service.icon === 'string' &&
        service.icon.length > 0 &&
        typeof service.color === 'string' &&
        service.color.length > 0 &&
        Array.isArray(service.features) &&
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
        typeof file.size === 'number' &&
        file.size >= 0 &&
        typeof file.uploadedDate === 'string' &&
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
    return Object.keys(defaultHomePageContent).every((key) => typeof home[key] === 'string');
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
