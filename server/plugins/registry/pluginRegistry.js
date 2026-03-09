const fs = require('node:fs');
const path = require('node:path');

function loadPluginManifests() {
  const manifestsDir = path.join(__dirname, '..', 'manifests');
  if (!fs.existsSync(manifestsDir)) return [];
  return fs
    .readdirSync(manifestsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(manifestsDir, file), 'utf8')));
}

module.exports = { loadPluginManifests };
