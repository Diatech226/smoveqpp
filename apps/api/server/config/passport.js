const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_CALLBACK_URL,
  CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY,
} = require('./env');

function envFlagEnabled(value) {
  return String(value ?? '').trim().toLowerCase() === 'true';
}

function createOAuthConfig() {
  const clerkConfigured = Boolean(CLERK_PUBLISHABLE_KEY && CLERK_SECRET_KEY);
  const legacyOAuthEnabled = envFlagEnabled(process.env.AUTH_ENABLE_LEGACY_OAUTH);
  const allowLegacyOAuth = legacyOAuthEnabled || !clerkConfigured;

  const googleEnabled = allowLegacyOAuth && Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  const facebookEnabled = allowLegacyOAuth && Boolean(FACEBOOK_APP_ID && FACEBOOK_APP_SECRET);

  return {
    providerMode: allowLegacyOAuth ? 'legacy_oauth' : 'clerk',
    googleEnabled,
    facebookEnabled,
    google: {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    facebook: {
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'emails', 'displayName', 'name'],
    },
  };
}

module.exports = { createOAuthConfig };
