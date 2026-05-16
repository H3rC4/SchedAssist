const fs = require('fs');

const content = fs.readFileSync('d:/proyectos/SaaS/scratch/i18n_modular.ts', 'utf8');

function parseConstants(content) {
  const constants = {};
  const regex = /const ([a-z]{2}_[a-z0-9_]+) = {([\s\S]*?)\n};/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    constants[match[1]] = match[2];
  }
  return constants;
}

function getOrderedSections(content, lang) {
  const regex = new RegExp(`${lang}: {[\\s\\S]*?\\.\\.\\.(.*?),`, 'g');
  const sections = [];
  let match;
  const langBlockRegex = new RegExp(`${lang}: {([\\s\\S]*?)}`, 'g');
  const langBlockMatch = langBlockRegex.exec(content);
  if (!langBlockMatch) return [];
  
  const langBlock = langBlockMatch[1];
  const sectionRegex = /\.\.\.(.*?),/g;
  while ((match = sectionRegex.exec(langBlock)) !== null) {
    sections.push(match[1].trim());
  }
  return sections;
}

const allConstants = parseConstants(content);
const languages = ['en', 'es', 'it'];
const cleanedConstants = {};

languages.forEach(lang => {
  const seenKeys = new Set();
  const orderedSections = getOrderedSections(content, lang);
  
  orderedSections.forEach(section => {
    const rawContent = allConstants[section];
    if (!rawContent) return;
    
    const lines = rawContent.split('\n');
    const cleanedLines = [];
    
    lines.forEach(line => {
      const keyMatch = line.match(/^\s*([a-zA-Z0-9_]+):/);
      if (keyMatch) {
        const key = keyMatch[1];
        if (seenKeys.has(key)) {
          // Skip duplicate key
          return;
        }
        seenKeys.add(key);
      }
      cleanedLines.push(line);
    });
    
    cleanedConstants[section] = cleanedLines.join('\n');
  });
});

// Reconstruct the file
let output = `import { es, it, enUS } from 'date-fns/locale';

export type Language = 'en' | 'es' | 'it';

export const dateLocales = {
  en: enUS,
  es: es,
  it: it
};

`;

Object.keys(cleanedConstants).forEach(section => {
  output += `const ${section} = {${cleanedConstants[section]}\n};\n\n`;
});

output += `export const translations = {
  en: {
${getOrderedSections(content, 'en').map(s => `    ...${s},`).join('\n')}
  },
  es: {
${getOrderedSections(content, 'es').map(s => `    ...${s},`).join('\n')}
  },
  it: {
${getOrderedSections(content, 'it').map(s => `    ...${s},`).join('\n')}
  },
};
`;

fs.writeFileSync('d:/proyectos/SaaS/src/lib/i18n.ts', output);
console.log('Successfully cleaned and written to src/lib/i18n.ts');
