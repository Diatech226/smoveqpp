#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const sourceDir = path.join(root, 'apps/api/server/data');
const backupRoot = path.join(root, 'apps/api/server/backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const targetDir = path.join(backupRoot, `backup-${timestamp}`);

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

if (!fs.existsSync(sourceDir)) {
  console.error('No apps/api/server/data directory found; nothing to backup.');
  process.exit(1);
}

copyRecursive(sourceDir, targetDir);
console.log(`Backup completed: ${targetDir}`);
console.log('Mongo backup (run separately): mongodump --uri "$MONGO_URI" --out apps/api/server/backups/mongo-' + timestamp);
