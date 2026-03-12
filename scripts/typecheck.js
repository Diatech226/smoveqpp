const fs = require('fs');

const targets = [
  'src/utils/authApi.ts',
  'src/contexts/AuthContext.tsx',
  'src/config/runtimeConfig.ts',
  'src/utils/observability.ts',
];
const violations = [];

for (const file of targets) {
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes('export')) {
    violations.push(`${file}: missing exports`);
  }
  if (source.includes(': any') || source.includes('<any>')) {
    violations.push(`${file}: contains forbidden any`);
  }
}

if (violations.length > 0) {
  console.error('Typecheck smoke failed:');
  for (const item of violations) console.error(`- ${item}`);
  process.exit(1);
}

console.log('Typecheck smoke passed.');
