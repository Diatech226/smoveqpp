const { createValidator } = require('./common');

const validatePatchSettings = createValidator((payload, errors) => {
  const value = {};
  if (payload.textLogo !== undefined) value.textLogo = String(payload.textLogo).trim().slice(0, 80);
  if (payload.heroVideoUrl !== undefined) value.heroVideoUrl = String(payload.heroVideoUrl).trim();
  if (payload.socialLinks !== undefined) {
    if (!Array.isArray(payload.socialLinks)) errors.push('socialLinks must be an array');
    else value.socialLinks = payload.socialLinks;
  }
  if (payload.brandTokens !== undefined) {
    if (!payload.brandTokens || typeof payload.brandTokens !== 'object' || Array.isArray(payload.brandTokens)) errors.push('brandTokens must be an object');
    else value.brandTokens = payload.brandTokens;
  }
  return value;
});

module.exports = { validatePatchSettings };
