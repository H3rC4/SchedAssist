
import fs from 'fs';

const content = fs.readFileSync('./src/lib/i18n.ts', 'utf8');

const enBlockMatch = content.match(/en: \{([\s\S]+?)\n  \},/);
if (enBlockMatch) {
  const enBlock = enBlockMatch[1];
  const lines = enBlock.split('\n');
  const keys = new Set();
  const duplicates = [];
  lines.forEach(line => {
    const match = line.match(/^\s+([a-zA-Z0-9_]+):/);
    if (match) {
      const key = match[1];
      if (keys.has(key)) {
        duplicates.push(key);
      }
      keys.add(key);
    }
  });
  console.log('Duplicate keys in EN:', duplicates.join(', '));
}
