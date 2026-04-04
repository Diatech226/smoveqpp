#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const backupDir = process.argv[2];
if (!backupDir) {
  console.error('Usage: node scripts/restore-content.js <backup-directory>');
  process.exit(1);
}

const root = process.cwd();
const sourceDir = path.resolve(root, backupDir);
const targetDir = path.join(root, 'apps/api/server/data');

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
  console.error(`Backup path not found: ${sourceDir}`);
  process.exit(1);
}

copyRecursive(sourceDir, targetDir);
console.log(`Restore completed from ${sourceDir} to ${targetDir}`);
console.log('Remember to restore Mongo data separately using mongorestore.');
