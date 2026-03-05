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

const logger = {
  info: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
};

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/smove';
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'change-me';
const APP_VERSION = process.env.APP_VERSION ?? 'v3';
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

const auditLogSchema = new mongoose.Schema(
  {
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

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

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
  return (ACTIONS[action] ?? []).includes(role);
}

function requireAction(action) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!isAllowed(req.user.role, action)) {
      return res.status(403).json({ error: `Role ${req.user.role} cannot perform ${action}` });
    }
    return next();
  };
}

async function logAudit(req, action, entityType, entityId, diff = undefined) {
  try {
    await AuditLog.create({
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

function enforceCsrf(req, res, next) {
  const token = req.get('X-CSRF-Token');
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  return next();
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

app.get('/api/health', async (_req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ok', db: 'ok', version: APP_VERSION, uptime: process.uptime() });
  } catch {
    res.status(500).json({ status: 'degraded', db: 'down', version: APP_VERSION, uptime: process.uptime() });
  }
});

app.get('/api/auth/session', (req, res) => {
  res.json({ user: req.user ? toSafeUser(req.user) : null, csrfToken: ensureCsrfToken(req) });
});

app.post('/api/auth/register', limiterAuth, async (req, res) => {
  try {
    const { email, password, name } = req.body ?? {};
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });
    if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email exists' });

    const user = await User.create({ email: email.toLowerCase(), name, role: resolveRole(email), passwordHash: await bcrypt.hash(password, 10), provider: 'local' });

    return req.login(user, async (error) => {
      if (error) return res.status(500).json({ error: 'Unable to start session' });
      await logAudit(req, 'register', 'user', String(user._id), { role: user.role });
      return res.json({ user: toSafeUser(user), csrfToken: ensureCsrfToken(req) });
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
          return res.json({ user: toSafeUser(user), csrfToken: req.session.csrfToken });
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

app.get('/api/public/brand', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.json({
    data: {
      colors: { primary: process.env.BRAND_COLOR_PRIMARY ?? '#00b3e8', secondary: process.env.BRAND_COLOR_SECONDARY ?? '#34c759' },
      typography: { heading: process.env.BRAND_FONT_HEADING ?? 'ABeeZee', body: process.env.BRAND_FONT_BODY ?? 'Abhaya Libre' },
    },
  });
});

app.get('/api/cms/summary', requireAction('postRead'), async (_req, res) => {
  const [totalPosts, drafts, published, archived] = await Promise.all([
    Post.countDocuments({ status: { $ne: 'removed' } }),
    Post.countDocuments({ status: 'draft' }),
    Post.countDocuments({ status: 'published' }),
    Post.countDocuments({ status: 'archived' }),
  ]);
  res.json({ totalPosts, drafts, published, archived });
});

app.get('/api/cms/posts', requireAction('postRead'), limiterSensitive, async (req, res) => {
  const page = Math.max(Number.parseInt(String(req.query.page ?? '1'), 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '20'), 10), 1), 100);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const query = { status: status || { $ne: 'removed' } };

  const [posts, total] = await Promise.all([
    Post.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Post.countDocuments(query),
  ]);

  res.json({ items: posts.map((post) => toPostResponse(post)), page, limit, total, totalPages: Math.ceil(total / limit) });
});

app.post('/api/cms/posts', requireAction('postCreate'), enforceCsrf, limiterSensitive, async (req, res) => {
  const { parsed, errors } = parsePostPayload(req.body);
  if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });

  if (await Post.exists({ slug: parsed.slug })) return res.status(409).json({ error: 'Slug already exists' });

  const post = await Post.create({ ...parsed, authorId: req.user._id, publishedAt: parsed.status === 'published' ? new Date() : null });
  await logAudit(req, 'post.create', 'post', String(post._id), { status: post.status });
  return res.status(201).json({ item: toPostResponse(post) });
});

app.put('/api/cms/posts/:id', requireAction('postUpdate'), enforceCsrf, limiterSensitive, async (req, res) => {
  const post = await Post.findById(req.params.id);
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
  return res.json({ item: toPostResponse(post) });
});

app.delete('/api/cms/posts/:id', requireAction('postDelete'), enforceCsrf, limiterSensitive, async (req, res) => {
  const post = await Post.findById(req.params.id);
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

app.use((error, _req, res, _next) => {
  logger.error({ error }, 'unhandled-request-error');
  res.status(500).json({ error: 'Unexpected server error' });
});

mongoose.connect(MONGO_URI).then(() => {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'api-started');
  });
}).catch((error) => {
  logger.error({ error }, 'mongo-connection-error');
  process.exit(1);
});
