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

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/smove';
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'change-me';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
    provider: { type: String, default: 'local' },
    providerId: { type: String },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

function toSafeUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function resolveRole(email) {
  return ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'viewer';
}

function enforceCsrf(req, res, next) {
  const token = req.get('X-CSRF-Token');
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  return next();
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
}, (profile) => ({
  providerId: profile.id,
  email: profile.emails?.[0]?.value,
  name: profile.displayName ?? 'Utilisateur Google',
}));

registerSocialStrategy('github', GitHubStrategy, {
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:4000/api/auth/github/callback',
  scope: ['user:email'],
}, (profile) => ({
  providerId: profile.id,
  email: profile.emails?.[0]?.value,
  name: profile.displayName ?? profile.username ?? 'Utilisateur GitHub',
}));

registerSocialStrategy('facebook', FacebookStrategy, {
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL ?? 'http://localhost:4000/api/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'emails'],
}, (profile) => ({
  providerId: profile.id,
  email: profile.emails?.[0]?.value,
  name: profile.displayName ?? 'Utilisateur Facebook',
}));

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(session({
  name: 'smove.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/api/auth/session', (req, res) => {
  res.json({ user: req.user ? toSafeUser(req.user) : null, csrfToken: ensureCsrfToken(req) });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body ?? {};
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });
    if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email exists' });

    const user = await User.create({
      email: email.toLowerCase(),
      name,
      role: resolveRole(email),
      passwordHash: await bcrypt.hash(password, 10),
      provider: 'local',
    });

    return req.login(user, (error) => {
      if (error) return res.status(500).json({ error: 'Unable to start session' });
      return res.json({ user: toSafeUser(user), csrfToken: ensureCsrfToken(req) });
    });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', (req, res, next) => {
  passport.authenticate('local', (error, user) => {
    if (error) return next(error);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    return req.login(user, (loginError) => {
      if (loginError) return next(loginError);
      return res.json({ user: toSafeUser(user), csrfToken: ensureCsrfToken(req) });
    });
  })(req, res, next);
});

app.post('/api/auth/logout', enforceCsrf, (req, res) => {
  req.logout(() => {
    req.session.destroy(() => res.status(204).end());
  });
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

mongoose.connect(MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Auth API on http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('Mongo connection error', error);
  process.exit(1);
});
