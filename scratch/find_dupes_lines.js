const fs = require('fs');
const content = fs.readFileSync('d:\\proyectos\\SaaS\\src\\lib\\i18n.ts', 'utf8');

const blocks = [
    { name: 'en', start: content.indexOf('en: {'), end: content.indexOf('  es: {') },
    { name: 'es', start: content.indexOf('es: {'), end: content.indexOf('  it: {') },
    { name: 'it', start: content.indexOf('it: {'), end: content.lastIndexOf('};') }
];

for (const blockInfo of blocks) {
    console.log(`--- Duplicates in ${blockInfo.name} ---`);
    const blockContent = content.substring(blockInfo.start, blockInfo.end);
    const lines = blockContent.split('\n');
    const seen = {};
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^\s+([a-zA-Z0-9_]+):/);
        if (match) {
            const key = match[1];
            if (!seen[key]) seen[key] = [];
            seen[key].push(i + 1 + (content.substring(0, blockInfo.start).split('\n').length - 1));
        }
    }
    for (const [key, lines] of Object.entries(seen)) {
        if (lines.length > 1) {
            console.log(`  ${key}: lines ${lines.join(', ')}`);
        }
    }
}
