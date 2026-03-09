const { CmsSettings } = require('../models/CmsSettings');

async function getSettings(tenantId, userId) {
  let item = await CmsSettings.findOne({ tenantId });
  if (!item) {
    item = await CmsSettings.create({ tenantId, updatedBy: userId, textLogo: 'SMOVE', heroVideoUrl: '' });
  }
  return item;
}

async function patchSettings({ tenantId, userId, payload }) {
  const item = await getSettings(tenantId, userId);
  Object.assign(item, payload, { updatedBy: userId });
  await item.save();
  return item;
}

module.exports = { getSettings, patchSettings };
