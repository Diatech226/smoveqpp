const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: GitHubStrategy } = require('passport-github2');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const { ok, fail } = require('./utils/apiResponse');
const { errorHandler } = require('./middleware/errorHandler');
const { enforceCsrf } = require('./middleware/enforceCsrf');
const { serviceRoutes } = require('./routes/service.routes');
const { eventRoutes } = require('./routes/events.routes');
const { taxonomyRoutes } = require('./routes/taxonomies.routes');
const { settingsRoutes } = require('./routes/settings.routes');
const { mediaRoutes } = require('./routes/media.routes');
const { hasPermission, Permissions } = require('./security/permissions');

const logger = {
  info: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
};

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/smove';
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'change-me';
const APP_VERSION = process.env.APP_VERSION ?? 'v3';
const DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG ?? 'default';
const MULTI_TENANT_ENABLED = (process.env.FEATURE_MULTI_TENANT ?? 'true').toLowerCase() !== 'false';
const BRAND_API_V1_ENABLED = (process.env.FEATURE_BRAND_API_V1 ?? 'true').toLowerCase() !== 'false';
const V5_PERSONALIZATION_ENABLED = (process.env.FEATURE_V5_PERSONALIZATION ?? 'true').toLowerCase() !== 'false';
const V5_GLOBAL_SEARCH_ENABLED = (process.env.FEATURE_V5_GLOBAL_SEARCH ?? 'true').toLowerCase() !== 'false';
const V5_LEADS_ENABLED = (process.env.FEATURE_V5_LEADS ?? 'true').toLowerCase() !== 'false';
const V5_JOBS_ENABLED = (process.env.FEATURE_V5_JOBS ?? 'true').toLowerCase() !== 'false';
const JOB_RUNNER_TOKEN = process.env.JOB_RUNNER_TOKEN ?? 'local-dev-job-token';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const ROLES = ['admin', 'editor', 'author', 'viewer'];
const POST_STATUSES = ['draft', 'review', 'scheduled', 'published', 'archived', 'removed'];
const ACTIONS = {
  postRead: ['admin', 'editor', 'author', 'viewer'],
  postCreate: ['admin', 'editor', 'author'],
  postUpdate: ['admin', 'editor', 'author'],
  postPublish: ['admin'],
  postDelete: ['admin', 'editor'],
  settingsUpdate: ['admin'],
  mediaDelete: ['admin', 'editor'],
};

const userSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String },
    role: { type: String, enum: ROLES, default: 'viewer' },
    provider: { type: String, default: 'local' },
    providerId: { type: String },
  },
  { timestamps: true },
);

const postSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 180 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, minlength: 3, maxlength: 200 },
    excerpt: { type: String, trim: true, maxlength: 320, default: '' },
    content: { type: String, required: true, trim: true, minlength: 10 },
    status: { type: String, enum: POST_STATUSES, default: 'draft', index: true },
    tags: { type: [String], default: [] },
    publishedAt: { type: Date, default: null, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, default: 'general', index: true },
  },
  { timestamps: true },
);
postSchema.index({ slug: 1 }, { unique: true });
postSchema.index({ tenantId: 1, status: 1, updatedAt: -1 });

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    domains: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active', index: true },
    branding: {
      logoUrl: { type: String, default: '' },
      faviconUrl: { type: String, default: '' },
      metadataBase: { type: String, default: '' },
      socialLinks: { type: mongoose.Schema.Types.Mixed, default: {} },
      palette: {
        primary: { type: String, default: '#00b3e8' },
        secondary: { type: String, default: '#34c759' },
      },
      tokens: { type: mongoose.Schema.Types.Mixed, default: {} },
      typography: {
        heading: { type: String, default: 'ABeeZee' },
        body: { type: String, default: 'Abhaya Libre' },
      },
    },
  },
  { timestamps: true },
);

const auditLogSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true },
    diff: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const audienceSegmentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    criteria: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const contentVariantSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    entityType: { type: String, enum: ['hero', 'cta', 'page_block'], required: true, index: true },
    entityKey: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);
contentVariantSchema.index({ tenantId: 1, entityType: 1, entityKey: 1, updatedAt: -1 });

const personalizationRuleSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    name: { type: String, required: true, trim: true },
    priority: { type: Number, default: 100, index: true },
    isActive: { type: Boolean, default: true, index: true },
    conditions: { type: mongoose.Schema.Types.Mixed, default: {} },
    segmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AudienceSegment', default: null },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentVariant', required: true },
  },
  { timestamps: true },
);

const leadSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    type: { type: String, enum: ['contact', 'quote', 'audit', 'brochure'], required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    company: { type: String, default: '' },
    message: { type: String, default: '' },
    source: { type: String, default: 'direct', index: true },
    campaign: { type: String, default: '', index: true },
    score: { type: Number, default: 0, index: true },
    status: { type: String, enum: ['new', 'qualified', 'hot', 'disqualified'], default: 'new', index: true },
    routing: {
      team: { type: String, default: 'default' },
      owner: { type: String, default: '' },
      pipeline: { type: String, default: 'main' },
    },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const jobSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    type: { type: String, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['queued', 'running', 'succeeded', 'failed'], default: 'queued', index: true },
    runAt: { type: Date, default: Date.now, index: true },
    attempts: { type: Number, default: 0 },
    lastError: { type: String, default: '' },
  },
  { timestamps: true },
);
jobSchema.index({ status: 1, runAt: 1 });

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Tenant = mongoose.model('Tenant', tenantSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);
const AudienceSegment = mongoose.model('AudienceSegment', audienceSegmentSchema);
const ContentVariant = mongoose.model('ContentVariant', contentVariantSchema);
const PersonalizationRule = mongoose.model('PersonalizationRule', personalizationRuleSchema);
const Lead = mongoose.model('Lead', leadSchema);
const Job = mongoose.model('Job', jobSchema);

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function matchesRuleContext(conditions = {}, context = {}) {
  if (!isPlainObject(conditions)) return false;
  return Object.entries(conditions).every(([key, expected]) => {
    const current = context[key];
    if (Array.isArray(expected)) return expected.includes(current);
    if (isPlainObject(expected) && Array.isArray(expected.anyOf)) return expected.anyOf.includes(current);
    return current === expected;
  });
}

async function enqueueJob({ tenantId, type, payload, runAt = new Date() }) {
  if (!V5_JOBS_ENABLED) return null;
  return Job.create({ tenantId, type, payload, runAt, status: 'queued' });
}

function computeLeadScore(payload = {}) {
  let score = 0;
  if (payload.type === 'quote' || payload.type === 'audit') score += 40;
  if (typeof payload.company === 'string' && payload.company.trim().length > 1) score += 20;
  if (typeof payload.message === 'string' && payload.message.trim().length > 80) score += 20;
  if (typeof payload.source === 'string' && payload.source.toLowerCase().includes('campaign')) score += 20;
  return Math.min(score, 100);
}

function resolveLeadStatus(score) {
  if (score >= 75) return 'hot';
  if (score >= 45) return 'qualified';
  return 'new';
}

function requireJobToken(req, res, next) {
  const token = req.get('X-Job-Token');
  if (!token || token !== JOB_RUNNER_TOKEN) return res.status(401).json({ error: 'Invalid job token' });
  return next();
}

function normalizeHost(host = '') {
  return host.replace(/:\d+$/, '').trim().toLowerCase();
}

async function ensureDefaultTenant() {
  return Tenant.findOneAndUpdate(
    { slug: DEFAULT_TENANT_SLUG },
    {
      $setOnInsert: {
        name: 'SMOVE Default',
        slug: DEFAULT_TENANT_SLUG,
        domains: [],
        status: 'active',
      },
    },
    { upsert: true, new: true },
  );
}

async function resolveTenant(req) {
  const fallback = await ensureDefaultTenant();
  if (!MULTI_TENANT_ENABLED) return fallback;

  const querySlug = typeof req.query?.tenant === 'string' ? normalizeSlug(req.query.tenant) : '';
  const headerValue = req.get('X-Tenant-Slug');
  const headerSlug = typeof headerValue === 'string' ? normalizeSlug(headerValue) : '';
  const resolvedHost = normalizeHost(req.get('host') ?? '');

  if (querySlug) {
    const byQuery = await Tenant.findOne({ slug: querySlug, status: 'active' });
    if (byQuery) return byQuery;
  }

  if (headerSlug) {
    const byHeader = await Tenant.findOne({ slug: headerSlug, status: 'active' });
    if (byHeader) return byHeader;
  }

  if (resolvedHost) {
    const byHost = await Tenant.findOne({ domains: resolvedHost, status: 'active' });
    if (byHost) return byHost;
  }

  return fallback;
}

function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

function toSafeUser(user) {
  return { id: String(user._id), email: user.email, name: user.name, role: user.role };
}

function resolveRole(email) {
  return ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'viewer';
}

function isAllowed(role, action) {
  const actionToPermission = {
    postRead: Permissions.POST_READ,
    postCreate: Permissions.POST_CREATE,
    postUpdate: Permissions.POST_UPDATE,
    postPublish: Permissions.POST_PUBLISH,
    postDelete: Permissions.POST_DELETE,
    settingsUpdate: Permissions.SETTINGS_UPDATE,
    mediaDelete: Permissions.MEDIA_DELETE,
  };

  const permission = actionToPermission[action];
  if (!permission) {
    return (ACTIONS[action] ?? []).includes(role);
  }

  return hasPermission(role, permission);
}

function requireAction(action) {
  return (req, res, next) => {
    if (!req.user) return fail(res, 401, 'UNAUTHENTICATED', 'Authentication required');
    if (!isAllowed(req.user.role, action)) {
      return fail(res, 403, 'FORBIDDEN', `Role ${req.user.role} cannot perform ${action}`);
    }
    return next();
  };
}

async function logAudit(req, action, entityType, entityId, diff = undefined) {
  try {
    await AuditLog.create({
      tenantId: req.tenant?._id,
      actorId: req.user?._id,
      action,
      entityType,
      entityId,
      diff,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? '',
    });
  } catch (error) {
    logger.error({ error, action, entityType, entityId }, 'audit-log-failed');
  }
}

function normalizeSlug(input = '') {
  return input.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);
}

function toPostResponse(post) {
  return {
    id: String(post._id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    status: post.status,
    tags: post.tags,
    publishedAt: post.publishedAt,
    authorId: String(post.authorId),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

function parsePostPayload(payload = {}, { isUpdate = false } = {}) {
  const errors = [];
  const parsed = {};

  if (!isUpdate || payload.title !== undefined) {
    if (typeof payload.title !== 'string' || payload.title.trim().length < 3) errors.push('title must be at least 3 chars');
    else parsed.title = payload.title.trim();
  }

  if (!isUpdate || payload.content !== undefined) {
    if (typeof payload.content !== 'string' || payload.content.trim().length < 10) errors.push('content must be at least 10 chars');
    else parsed.content = payload.content.trim();
  }

  if (payload.slug !== undefined) {
    if (typeof payload.slug !== 'string') errors.push('slug must be a string');
    else parsed.slug = payload.slug.trim();
  }

  if (payload.excerpt !== undefined) {
    if (typeof payload.excerpt !== 'string') errors.push('excerpt must be a string');
    else parsed.excerpt = payload.excerpt.trim();
  }

  if (payload.status !== undefined) {
    if (!POST_STATUSES.includes(payload.status)) errors.push('invalid status');
    else parsed.status = payload.status;
  }

  if (payload.tags !== undefined) {
    if (!Array.isArray(payload.tags) || payload.tags.some((tag) => typeof tag !== 'string')) errors.push('tags must be string[]');
    else parsed.tags = payload.tags.map((tag) => tag.trim()).filter(Boolean);
  }

  if (payload.category !== undefined) {
    if (typeof payload.category !== 'string' || payload.category.trim().length < 2) errors.push('category must be a string');
    else parsed.category = payload.category.trim();
  }

  const rawSlug = typeof parsed.slug === 'string' && parsed.slug.length > 0 ? parsed.slug : parsed.title;
  if (!isUpdate || rawSlug) {
    const normalized = normalizeSlug(rawSlug);
    if (!normalized || normalized.length < 3) errors.push('slug must contain at least 3 valid characters');
    else parsed.slug = normalized;
  }

  if (!isUpdate && (!parsed.title || !parsed.content)) errors.push('title and content are required');

  return { parsed: errors.length ? null : parsed, errors };
}

function createSimpleRateLimit({ windowMs, max, message }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }
    entry.count += 1;
    hits.set(key, entry);
    if (entry.count > max) return res.status(429).json(message);
    return next();
  };
}

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user?.passwordHash) return done(null, false);
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return done(null, false);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }),
);

passport.serializeUser((user, done) => done(null, String(user._id)));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user ?? false);
  } catch (error) {
    done(error);
  }
});

function registerSocialStrategy(name, Strategy, options, mapProfile) {
  if (!options.clientID || !options.clientSecret) return;

  passport.use(
    name,
    new Strategy(options, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const normalized = mapProfile(profile);
        if (!normalized.email) return done(null, false);

        let user = await User.findOne({
          $or: [
            { provider: name, providerId: normalized.providerId },
            { email: normalized.email.toLowerCase() },
          ],
        });

        if (!user) {
          user = await User.create({
            email: normalized.email.toLowerCase(),
            name: normalized.name,
            role: resolveRole(normalized.email),
            provider: name,
            providerId: normalized.providerId,
          });
        } else if (user.provider !== name || !user.providerId) {
          user.provider = name;
          user.providerId = normalized.providerId;
          user.name = normalized.name;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );
}

registerSocialStrategy('google', GoogleStrategy, {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4000/api/auth/google/callback',
  scope: ['profile', 'email'],
}, (profile) => ({ providerId: profile.id, email: profile.emails?.[0]?.value, name: profile.displayName ?? 'Utilisateur Google' }));

registerSocialStrategy('github', GitHubStrategy, {
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:4000/api/auth/github/callback',
  scope: ['user:email'],
}, (profile) => ({ providerId: profile.id, email: profile.emails?.[0]?.value, name: profile.displayName ?? profile.username ?? 'Utilisateur GitHub' }));

registerSocialStrategy('facebook', FacebookStrategy, {
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL ?? 'http://localhost:4000/api/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'emails'],
}, (profile) => ({ providerId: profile.id, email: profile.emails?.[0]?.value, name: profile.displayName ?? 'Utilisateur Facebook' }));

const app = express();
const limiterAuth = createSimpleRateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many authentication attempts, retry later.' } });
const limiterSensitive = createSimpleRateLimit({ windowMs: 5 * 60 * 1000, max: 80, message: { error: 'Rate limit exceeded.' } });

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(session({
  name: 'smove.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(async (req, _res, next) => {
  try {
    req.tenant = await resolveTenant(req);
    return next();
  } catch (error) {
    return next(error);
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ok', db: 'ok', version: APP_VERSION, uptime: process.uptime() });
  } catch {
    res.status(500).json({ status: 'degraded', db: 'down', version: APP_VERSION, uptime: process.uptime() });
  }
});

app.get('/api/auth/session', (req, res) => {
  ok(res, { user: req.user ? toSafeUser(req.user) : null, csrfToken: ensureCsrfToken(req) }, {});
});

app.post('/api/auth/register', limiterAuth, async (req, res) => {
  try {
    const { email, password, name } = req.body ?? {};
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });
    if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email exists' });

    const user = await User.create({ tenantId: req.tenant?._id, email: email.toLowerCase(), name, role: resolveRole(email), passwordHash: await bcrypt.hash(password, 10), provider: 'local' });

    return req.login(user, async (error) => {
      if (error) return res.status(500).json({ error: 'Unable to start session' });
      await logAudit(req, 'register', 'user', String(user._id), { role: user.role });
      return res.json({ data: { user: toSafeUser(user), csrfToken: ensureCsrfToken(req) } });
    });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', limiterAuth, (req, res, next) => {
  passport.authenticate('local', (error, user) => {
    if (error) return next(error);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    return req.login(user, async (loginError) => {
      if (loginError) return next(loginError);
      req.session.regenerate(async () => {
        req.login(user, async (regenErr) => {
          if (regenErr) return next(regenErr);
          ensureCsrfToken(req);
          await logAudit(req, 'login', 'user', String(user._id));
          return res.json({ data: { user: toSafeUser(user), csrfToken: req.session.csrfToken } });
        });
      });
    });
  })(req, res, next);
});

app.post('/api/auth/logout', enforceCsrf, async (req, res) => {
  if (req.user) await logAudit(req, 'logout', 'user', String(req.user._id));
  req.logout(() => {
    req.session.destroy(() => res.status(204).end());
  });
});

app.get('/api/public/brand', (req, res) => {
  const tenant = req.tenant;
  const branding = tenant?.branding ?? {};
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.json({
    data: {
      tenant: tenant ? { id: String(tenant._id), name: tenant.name, slug: tenant.slug } : null,
      colors: {
        primary: branding.palette?.primary ?? process.env.BRAND_COLOR_PRIMARY ?? '#00b3e8',
        secondary: branding.palette?.secondary ?? process.env.BRAND_COLOR_SECONDARY ?? '#34c759',
      },
      typography: {
        heading: branding.typography?.heading ?? process.env.BRAND_FONT_HEADING ?? 'ABeeZee',
        body: branding.typography?.body ?? process.env.BRAND_FONT_BODY ?? 'Abhaya Libre',
      },
      logoUrl: branding.logoUrl ?? '',
      faviconUrl: branding.faviconUrl ?? '',
      metadataBase: branding.metadataBase ?? '',
      socialLinks: branding.socialLinks ?? {},
      tokens: branding.tokens ?? {},
    },
  });
});

app.get('/api/v1/brand', (req, res) => {
  if (!BRAND_API_V1_ENABLED) return res.status(404).json({ error: 'Feature disabled' });
  const tenant = req.tenant;
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  return res.json({
    data: {
      tenant: {
        id: String(tenant._id),
        name: tenant.name,
        slug: tenant.slug,
        domains: tenant.domains,
        status: tenant.status,
      },
      branding: tenant.branding,
      updatedAt: tenant.updatedAt,
    },
  });
});


app.get('/api/v5/personalization/resolve', async (req, res) => {
  if (!V5_PERSONALIZATION_ENABLED) return res.status(404).json({ error: 'Feature disabled' });
  const tenantFilter = req.tenant ? { tenantId: req.tenant._id } : {};
  const context = {
    tenant: req.tenant?.slug,
    source: typeof req.query.source === 'string' ? req.query.source : '',
    campaign: typeof req.query.campaign === 'string' ? req.query.campaign : '',
    locale: typeof req.query.locale === 'string' ? req.query.locale : '',
    country: typeof req.query.country === 'string' ? req.query.country : '',
    device: typeof req.query.device === 'string' ? req.query.device : '',
    userType: typeof req.query.userType === 'string' ? req.query.userType : '',
  };

  const entityType = typeof req.query.entityType === 'string' ? req.query.entityType : 'hero';
  const entityKey = typeof req.query.entityKey === 'string' ? req.query.entityKey : 'homepage-main';

  const variants = await ContentVariant.find({ ...tenantFilter, entityType, entityKey }).lean();
  const variantById = new Map(variants.map((variant) => [String(variant._id), variant]));
  const rules = await PersonalizationRule.find({ ...tenantFilter, isActive: true }).sort({ priority: 1, createdAt: 1 }).lean();

  let matchedRule = null;
  let variant = variants.find((candidate) => candidate.isDefault) ?? variants[0] ?? null;

  for (const rule of rules) {
    const candidate = variantById.get(String(rule.variantId));
    if (!candidate || candidate.entityType !== entityType || candidate.entityKey !== entityKey) continue;
    if (matchesRuleContext(rule.conditions ?? {}, context)) {
      matchedRule = rule;
      variant = candidate;
      break;
    }
  }

  return res.json({
    data: {
      context,
      entityType,
      entityKey,
      variant,
      matchedRule: matchedRule ? {
        id: String(matchedRule._id),
        name: matchedRule.name,
        priority: matchedRule.priority,
      } : null,
    },
  });
});

app.post('/api/cms/v5/audience-segments', requireAction('settingsUpdate'), enforceCsrf, limiterSensitive, async (req, res) => {
  if (!V5_PERSONALIZATION_ENABLED) return res.status(404).json({ error: 'Feature disabled' });
  const { name, description = '', criteria = {}, isActive = true } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length < 2) return res.status(400).json({ error: 'name is required' });
  const segment = await AudienceSegment.create({ tenantId: req.tenant?._id, name: name.trim(), description, criteria, isActive: Boolean(isActive) });
  await logAudit(req, 'v5.segment.create', 'audience_segment', String(segment._id));
  return res.status(201).json({ item: segment });
});

app.post('/api/cms/v5/content-variants', requireAction('postUpdate'), enforceCsrf, limiterSensitive, async (req, res) => {
  if (!V5_PERSONALIZATION_ENABLED) return res.status(404).json({ error: 'Feature disabled' });
  const { entityType, entityKey, title, content = {}, metadata = {}, isDefault = false } = req.body ?? {};
  if (!['hero', 'cta', 'page_block'].includes(entityType)) return res.status(400).json({ error: 'invalid entityType' });
  if (typeof entityKey !== 'string' || entityKey.trim().length < 2) return res.status(400).json({ error: 'entityKey is required' });
  if (typeof title !== 'string' || title.trim().length < 2) return res.status(400).json({ error: 'title is required' });

  const variant = await ContentVariant.create({
    tenantId: req.tenant?._id,
    entityType,
    entityKey: entityKey.trim(),
    title: title.trim(),
    content,
    metadata,
    isDefault: Boolean(isDefault),
  });
  await logAudit(req, 'v5.variant.create', 'content_variant', String(variant._id));
  return res.status(201).json({ item: variant });
});

app.post('/api/cms/v5/personalization-rules', requireAction('settingsUpdate'), enforceCsrf, limiterSensitive, async (req, res) => {
  if (!V5_PERSONALIZATION_ENABLED) return res.status(404).json({ error: 'Feature disabled' });
  const { name, priority = 100, conditions = {}, segmentId = null, variantId, isActive = true } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length < 2) return res.status(400).json({ error: 'name is required' });
  if (typeof variantId !== 'string') return res.status(400).json({ error: 'variantId is required' });

  const variant = await ContentVariant.findOne({ _id: variantId, ...(req.tenant ? { tenantId: req.tenant._id } : {}) });
  if (!variant) return res.status(404).json({ error: 'Variant not found' });

  const rule = await PersonalizationRule.create({
    tenantId: req.tenant?._id,
    name: name.trim(),
    priority,
    conditions,
    segmentId,
    variantId: variant._id,
    isActive: Boolean(isActive),
  });
  await logAudit(req, 'v5.rule.create', 'personalization_rule', String(rule._id));
  return res.status(201).json({ item: rule });
});

app.get('/api/cms/v5/search', requireAction('postRead'), limiterSensitive, async (req, res) => {
  if (!V5_GLOBAL_SEARCH_ENABLED) return res.status(404).json({ error: 'Feature disabled' });
  const queryText = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (queryText.length < 2) return res.status(400).json({ error: 'q must be at least 2 chars' });

  const tenantFilter = req.tenant ? { tenantId: req.tenant._id } : {};
  const regex = new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const [posts, leads, variants, users] = await Promise.all([
    Post.find({ ...tenantFilter, status: { $ne: 'removed' }, $or: [{ title: regex }, { excerpt: regex }, { content: regex }, { tags: regex }] }).limit(10).lean(),
    V5_LEADS_ENABLED ? Lead.find({ ...tenantFilter, $or: [{ name: regex }, { email: regex }, { company: regex }, { message: regex }, { source: regex }, { campaign: regex }] }).limit(10).lean() : [],
    ContentVariant.find({ ...tenantFilter, $or: [{ title: regex }, { entityKey: regex }] }).limit(10).lean(),
    User.find({ ...(req.tenant ? { tenantId: req.tenant._id } : {}), $or: [{ name: regex }, { email: regex }] }).limit(10).select('name email role').lean(),
  ]);

  return res.json({
    query: queryText,
    results: {
      posts: posts.map((post) => ({ id: String(post._id), title: post.title, slug: post.slug, status: post.status })),
      leads: leads.map((lead) => ({ id: String(lead._id), name: lead.name, email: lead.email, status: lead.status, score: lead.score })),
      contentVariants: variants.map((variant) => ({ id: String(variant._id), title: variant.title, entityType: variant.entityType, entityKey: variant.entityKey })),
      users: users.map((user) => ({ id: String(user._id), name: user.name, email: user.email, role: user.role })),
    },
  });
});

app.post('/api/public/forms/:type', limiterSensitive, async (req, res) => {
  if (!V5_LEADS_ENABLED) return res.status(404).json({ error: 'Feature disabled' });
  const formType = req.params.type;
  if (!['contact', 'quote', 'audit', 'brochure'].includes(formType)) return res.status(400).json({ error: 'invalid form type' });

  const { name, email, company = '', message = '', campaign = '', source = 'direct', context = {} } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length < 2) return res.status(400).json({ error: 'name is required' });
  if (typeof email !== 'string' || !email.includes('@')) return res.status(400).json({ error: 'email is invalid' });

  const leadPayload = { type: formType, name: name.trim(), email: email.trim().toLowerCase(), company, message, campaign, source, context };
  const score = computeLeadScore(leadPayload);
  const lead = await Lead.create({
    tenantId: req.tenant?._id,
    ...leadPayload,
    score,
    status: resolveLeadStatus(score),
    routing: {
      team: req.tenant?.slug ?? 'default',
      owner: score >= 75 ? 'admin-on-call' : '',
      pipeline: 'inbound',
    },
  });

  await enqueueJob({ tenantId: req.tenant?._id, type: 'lead.received', payload: { leadId: String(lead._id), score: lead.score, status: lead.status } });
  await logAudit(req, 'v5.lead.capture', 'lead', String(lead._id), { type: lead.type, score: lead.score });
  return res.status(201).json({ item: lead });
});

app.post('/api/cms/v5/jobs', requireAction('settingsUpdate'), enforceCsrf, limiterSensitive, async (req, res) => {
  if (!V5_JOBS_ENABLED) return res.status(404).json({ error: 'Feature disabled' });
  const { type, payload = {}, runAt } = req.body ?? {};
  if (typeof type !== 'string' || type.trim().length < 3) return res.status(400).json({ error: 'type is required' });
  const job = await enqueueJob({ tenantId: req.tenant?._id, type: type.trim(), payload, runAt: runAt ? new Date(runAt) : new Date() });
  await logAudit(req, 'v5.job.enqueue', 'job', String(job._id), { type: job.type });
  return res.status(201).json({ item: job });
});

app.post('/api/internal/jobs/run-next', requireJobToken, async (req, res) => {
  if (!V5_JOBS_ENABLED) return res.status(404).json({ error: 'Feature disabled' });
  const now = new Date();
  const job = await Job.findOneAndUpdate(
    { status: 'queued', runAt: { $lte: now } },
    { $set: { status: 'running' }, $inc: { attempts: 1 } },
    { sort: { runAt: 1, createdAt: 1 }, new: true },
  );
  if (!job) return res.status(204).end();

  const fail = typeof req.query.fail === 'string' && req.query.fail === '1';
  if (fail) {
    job.status = 'failed';
    job.lastError = 'Simulated failure';
  } else {
    job.status = 'succeeded';
    job.lastError = '';
  }
  await job.save();

  return res.json({ item: job });
});

app.get('/api/cms/summary', requireAction('postRead'), async (req, res) => {
  const tenantFilter = req.tenant ? { tenantId: req.tenant._id } : {};
  const [totalPosts, drafts, published, archived] = await Promise.all([
    Post.countDocuments({ ...tenantFilter, status: { $ne: 'removed' } }),
    Post.countDocuments({ ...tenantFilter, status: 'draft' }),
    Post.countDocuments({ ...tenantFilter, status: 'published' }),
    Post.countDocuments({ ...tenantFilter, status: 'archived' }),
  ]);
  res.json({ data: { totalPosts, drafts, published, archived } });
});

app.get('/api/cms/posts', requireAction('postRead'), limiterSensitive, async (req, res) => {
  const page = Math.max(Number.parseInt(String(req.query.page ?? '1'), 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '20'), 10), 1), 100);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const query = { status: status || { $ne: 'removed' } };
  if (req.tenant) query.tenantId = req.tenant._id;

  const [posts, total] = await Promise.all([
    Post.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Post.countDocuments(query),
  ]);

  res.json({ data: { items: posts.map((post) => toPostResponse(post)), page, limit, total, totalPages: Math.ceil(total / limit) } });
});

app.post('/api/cms/posts', requireAction('postCreate'), enforceCsrf, limiterSensitive, async (req, res) => {
  const { parsed, errors } = parsePostPayload(req.body);
  if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });

  if (await Post.exists({ slug: parsed.slug })) return res.status(409).json({ error: 'Slug already exists' });

  const post = await Post.create({ ...parsed, tenantId: req.tenant?._id, authorId: req.user._id, publishedAt: parsed.status === 'published' ? new Date() : null });
  await logAudit(req, 'post.create', 'post', String(post._id), { status: post.status });
  return res.status(201).json({ data: { item: toPostResponse(post) } });
});

app.put('/api/cms/posts/:id', requireAction('postUpdate'), enforceCsrf, limiterSensitive, async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, ...(req.tenant ? { tenantId: req.tenant._id } : {}) });
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const { parsed, errors } = parsePostPayload(req.body, { isUpdate: true });
  if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });
  if (parsed.slug && parsed.slug !== post.slug && await Post.exists({ slug: parsed.slug })) return res.status(409).json({ error: 'Slug already exists' });

  if (parsed.status === 'published' && !isAllowed(req.user.role, 'postPublish')) {
    return res.status(403).json({ error: 'Only admin can publish posts' });
  }

  const before = { status: post.status, title: post.title, category: post.category };
  Object.assign(post, parsed);
  if (parsed.status) post.publishedAt = parsed.status === 'published' ? (post.publishedAt ?? new Date()) : null;
  await post.save();
  await logAudit(req, 'post.update', 'post', String(post._id), { before, after: { status: post.status, title: post.title, category: post.category } });
  return res.json({ data: { item: toPostResponse(post) } });
});

app.delete('/api/cms/posts/:id', requireAction('postDelete'), enforceCsrf, limiterSensitive, async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, ...(req.tenant ? { tenantId: req.tenant._id } : {}) });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.status = 'removed';
  await post.save();
  await logAudit(req, 'post.soft_delete', 'post', String(post._id), { status: 'removed' });
  return res.status(204).end();
});

for (const provider of ['google', 'github', 'facebook']) {
  app.get(`/api/auth/${provider}`, (req, res, next) => {
    if (!passport._strategy(provider)) return res.status(404).json({ error: `${provider} not configured` });
    return passport.authenticate(provider)(req, res, next);
  });

  app.get(`/api/auth/${provider}/callback`, (req, res, next) => {
    if (!passport._strategy(provider)) return res.redirect(`${CLIENT_ORIGIN}/#login`);
    return passport.authenticate(provider, { failureRedirect: `${CLIENT_ORIGIN}/#login` })(req, res, () => {
      ensureCsrfToken(req);
      res.redirect(`${CLIENT_ORIGIN}/#cms-dashboard`);
    });
  });
}

app.use('/uploads', express.static('server/uploads'));

app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/taxonomies', taxonomyRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/media', mediaRoutes);

app.use((error, _req, res, _next) => {
  logger.error({ error }, 'unhandled-request-error');
  errorHandler(error, _req, res, _next);
});

mongoose.connect(MONGO_URI).then(() => {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'api-started');
  });
}).catch((error) => {
  logger.error({ error }, 'mongo-connection-error');
  process.exit(1);
});
