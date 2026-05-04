
const fs = require('fs');
const content = fs.readFileSync('d:/proyectos/SaaS/src/lib/i18n.ts', 'utf8');

function findDuplicates(langCode) {
    const startIdx = content.indexOf(langCode + ': {');
    if (startIdx === -1) return;
    
    let braceCount = 0;
    let endIdx = -1;
    for (let i = startIdx + langCode.length + 2; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') {
            if (braceCount === 0) {
                endIdx = i;
                break;
            }
            braceCount--;
        }
    }
    
    if (endIdx === -1) return;
    
    const langSection = content.substring(startIdx, endIdx);
    const keys = langSection.match(/^\s+([a-zA-Z0-9_]+):/gm);
    if (!keys) return;
    
    const keyCounts = {};
    keys.forEach(k => {
        const cleanKey = k.trim().replace(':', '');
        keyCounts[cleanKey] = (keyCounts[cleanKey] || 0) + 1;
    });
    
    console.log(`--- Duplicates in ${langCode} ---`);
    for (const [key, count] of Object.entries(keyCounts)) {
        if (count > 1) {
            console.log(`${key}: ${count}`);
        }
    }
}

findDuplicates('en');
findDuplicates('es');
findDuplicates('it');
