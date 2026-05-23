#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { normalizeMediaReference } = require('../api/server/utils/mediaResolver');

const target = path.resolve(__dirname, '../api/server/data/content.json');
const raw = JSON.parse(fs.readFileSync(target, 'utf8'));
const mediaIds = new Set((raw.mediaFiles || raw.mediaLibrary || []).map((m) => m.id));
const report = { migrated: [], unresolved: [], inactive: [] };

function maybe(fieldPath, value) {
  if (typeof value !== 'string') return value;
  const next = normalizeMediaReference(value, { allowIdOnly: true, apiOrigin: 'https://smoveapi-1.onrender.com' });
  if (next && next !== value) report.migrated.push({ fieldPath, from: value, to: next });
  if (next.startsWith('media:') && !mediaIds.has(next.slice(6))) report.unresolved.push({ fieldPath, value: next });
  if (!next) report.inactive.push({ fieldPath, value });
  return next || value;
}

(raw.blogPosts||[]).forEach((p,i)=>{ p.featuredImage=maybe(`blogPosts[${i}].featuredImage`,p.featuredImage); if(p.mediaRoles){Object.keys(p.mediaRoles).forEach(k=>p.mediaRoles[k]=maybe(`blogPosts[${i}].mediaRoles.${k}`,p.mediaRoles[k]));}});
(raw.projects||[]).forEach((p,i)=>{ ['featuredImage','mainImage'].forEach(k=>p[k]=maybe(`projects[${i}].${k}`,p[k])); if(Array.isArray(p.images)) p.images=p.images.map((v,j)=>maybe(`projects[${i}].images[${j}]`,v)); if(p.mediaRoles){Object.keys(p.mediaRoles).forEach(k=>p.mediaRoles[k]=maybe(`projects[${i}].mediaRoles.${k}`,p.mediaRoles[k]));}});
(raw.services||[]).forEach((p,i)=>{ ['iconLikeAsset','visualMedia','media','image'].forEach(k=>p[k]=maybe(`services[${i}].${k}`,p[k])); });
const brand=raw.settings?.siteSettings?.brandMedia||{}; ['logo','logoDark','favicon','defaultSocialImage'].forEach(k=>brand[k]=maybe(`settings.siteSettings.brandMedia.${k}`,brand[k]));
((raw.pageContent?.home?.heroBackgroundItems)||[]).forEach((it,i)=>['media','desktopMedia','tabletMedia','mobileMedia','videoMedia'].forEach(k=>it[k]=maybe(`pageContent.home.heroBackgroundItems[${i}].${k}`,it[k])));

fs.writeFileSync(target, JSON.stringify(raw,null,2));
console.log(JSON.stringify(report,null,2));
