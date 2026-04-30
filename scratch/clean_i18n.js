const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let currentLang = null;
let seenKeys = new Set();
const result = [];

for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === 'en: {') {
        currentLang = 'en';
        seenKeys = new Set();
        result.push(line);
    } else if (trimmed === 'es: {') {
        currentLang = 'es';
        seenKeys = new Set();
        result.push(line);
    } else if (trimmed === 'it: {') {
        currentLang = 'it';
        seenKeys = new Set();
        result.push(line);
    } else if (currentLang && trimmed.startsWith('},')) {
        currentLang = null;
        result.push(line);
    } else if (currentLang) {
        // Detect key: key: value or key: (args) =>
        const match = line.match(/^\s+([a-zA-Z0-9_]+):/);
        if (match) {
            const key = match[1];
            if (seenKeys.has(key)) {
                console.log(`Skipping duplicate key "${key}" in ${currentLang}`);
                continue;
            }
            seenKeys.add(key);
            result.push(line);
        } else {
            result.push(line);
        }
    } else {
        result.push(line);
    }
}

fs.writeFileSync(filePath, result.join('\n'));
console.log('Done cleaning i18n.ts');
