const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOTS = ['server'];
const EXTENSIONS = new Set(['.js']);
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'build') continue;
      walk(full);
      continue;
    }

    if (!EXTENSIONS.has(path.extname(entry.name))) continue;
    const source = fs.readFileSync(full, 'utf8');
    if (source.includes('<<<<<<<') || source.includes('>>>>>>>')) {
      violations.push(`${full}: contains unresolved merge markers`);
    }

    try {
      execFileSync(process.execPath, ['--check', full], { stdio: 'pipe' });
    } catch (error) {
      violations.push(`${full}: syntax check failed`);
    }
  }
}

for (const root of ROOTS) {
  walk(path.resolve(process.cwd(), root));
}

if (violations.length > 0) {
  console.error('Lint violations found:');
  for (const item of violations) console.error(`- ${item}`);
  process.exit(1);
}

console.log('Lint passed.');
