#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const contentPath = path.join(root, 'server/data/content.json');
const auditPath = path.join(root, 'server/data/audit-log.json');
const uploadsRoot = path.join(root, 'server/data/uploads');

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(contentPath)) fail('Missing server/data/content.json');
if (!fs.existsSync(auditPath)) fail('Missing server/data/audit-log.json');

const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

if (!Array.isArray(content.blogPosts) || !Array.isArray(content.projects) || !Array.isArray(content.mediaFiles)) {
  fail('Invalid content.json shape.');
}
if (!Array.isArray(audit.events)) {
  fail('Invalid audit-log.json shape.');
}

const missingUploadFiles = [];
for (const file of content.mediaFiles) {
  if (typeof file.url === 'string' && file.url.startsWith('/uploads/')) {
    const rel = file.url.replace('/uploads/', '');
    const abs = path.join(uploadsRoot, rel);
    if (!fs.existsSync(abs)) missingUploadFiles.push(file.id || rel);
  }
}

if (missingUploadFiles.length) {
  fail('Missing upload blobs for media IDs: ' + missingUploadFiles.join(', '));
}

console.log('Integrity check passed.');
console.log(`Blog posts: ${content.blogPosts.length}`);
console.log(`Projects: ${content.projects.length}`);
console.log(`Media files: ${content.mediaFiles.length}`);
console.log(`Audit events: ${audit.events.length}`);
