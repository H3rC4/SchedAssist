const fs = require('fs');
const content = fs.readFileSync('d:\\proyectos\\SaaS\\src\\lib\\i18n.ts', 'utf8');

const enBlock = content.match(/en: \{([\s\S]*?)\n\s\ses: \{/)[1];
const esBlock = content.match(/es: \{([\s\S]*?)\n\s\sit: \{/)[1];
const itBlock = content.match(/it: \{([\s\S]*?)\n\};/)[1];

const blocks = { en: enBlock, es: esBlock, it: itBlock };

for (const [lang, block] of Object.entries(blocks)) {
    console.log(`--- Duplicates in ${lang} ---`);
    const lines = block.split('\n');
    const seen = new Set();
    const dupes = new Set();
    for (const line of lines) {
        const match = line.match(/^\s+([a-zA-Z0-9_]+):/);
        if (match) {
            const key = match[1];
            if (seen.has(key)) {
                dupes.add(key);
            }
            seen.add(key);
        }
    }
    for (const d of Array.from(dupes).sort()) {
        console.log(`  ${d}`);
    }
}
