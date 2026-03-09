const { loadPluginManifests } = require('../registry/pluginRegistry');

function getPluginCatalog() {
  return loadPluginManifests().map((manifest) => ({
    ...manifest,
    lifecycle: ['install', 'activate', 'deactivate'],
  }));
}

module.exports = { getPluginCatalog };
