const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const uploadRoot = path.join(__dirname, '..', 'uploads', 'media');

async function saveLocalFile({ buffer, originalName }) {
  await fs.mkdir(uploadRoot, { recursive: true });
  const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '-');
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeName}`;
  const fullPath = path.join(uploadRoot, filename);
  await fs.writeFile(fullPath, buffer);
  return { filename, url: `/uploads/media/${filename}`, storageProvider: 'local' };
}

async function deleteLocalFile(filename) {
  if (!filename) return;
  const fullPath = path.join(uploadRoot, filename);
  await fs.rm(fullPath, { force: true });
}

module.exports = { saveLocalFile, deleteLocalFile };
