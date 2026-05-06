const fs = require('fs');
const content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

const blocks = {
  en: content.match(/en:\s*{([\s\S]*?)},\s*es:/)[1],
  es: content.match(/es:\s*{([\s\S]*?)},\s*it:/)[1],
  it: content.match(/it:\s*{([\s\S]*?)}\s*}\s*;/)[1]
};

for (const [lang, block] of Object.entries(blocks)) {
  console.log(`\nChecking ${lang.toUpperCase()}...`);
  const lines = block.split('\n');
  const keys = new Set();
  const levelStack = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) return;

    // Check for nesting
    if (trimmed.includes('{')) {
      levelStack.push(trimmed.split(':')[0].trim());
    }
    if (trimmed.includes('}')) {
      levelStack.pop();
    }

    const match = trimmed.match(/^([a-zA-Z0-9_]+):/);
    if (match) {
      const key = match[1];
      const fullKey = [...levelStack, key].join('.');
      if (keys.has(fullKey)) {
        console.log(`DUPLICATE FOUND: ${fullKey} at line ${index + 1} of block ${lang}`);
      }
      keys.add(fullKey);
    }
  });
}
