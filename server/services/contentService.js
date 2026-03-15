const BLOG_STATUSES = new Set(['draft', 'in_review', 'published', 'archived']);
const MEDIA_TYPES = new Set(['image', 'video', 'document']);
const PROJECT_STATUSES = new Set(['draft', 'published', 'archived']);

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

  listBlogPosts() {
    return this.readState().blogPosts.map((post) => this.normalizePost(post));
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
    return this.readState()
      .projects
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
    if (!post.title?.trim() || !post.slug?.trim() || !post.content?.trim() || !post.excerpt?.trim()) {
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
      mainImage: asTrimmedString(project?.mainImage) || 'project cover image',
      images: Array.isArray(project?.images) ? project.images.map((entry) => `${entry}`.trim()).filter(Boolean) : [],
      featured: Boolean(project?.featured),
      status,
      createdAt: project?.createdAt || nowIso,
      updatedAt: nowIso,
      links: project?.links && typeof project.links === 'object'
        ? {
            live: typeof project.links.live === 'string' ? project.links.live.trim() : undefined,
            caseStudy: typeof project.links.caseStudy === 'string' ? project.links.caseStudy.trim() : undefined,
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
        Array.isArray(project.images) &&
        PROJECT_STATUSES.has(project.status)
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
