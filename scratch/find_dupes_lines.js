const fs = require('fs');

const content = fs.readFileSync('d:/proyectos/SaaS/scratch/i18n_modular.ts', 'utf8');

function findDupesWithLines(content, lang) {
  const lines = content.split('\n');
  const counts = {};
  const lineNumbers = {};
  
  // We need to know where the lang sections are
  // But since we are looking at the whole file for duplicates of keys in general, 
  // let's just find all keys and their lines.
  
  const regex = /^\s*([a-z0-9_]+):/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const offset = match.index;
    const lineNumber = content.substring(0, offset).split('\n').length;
    
    counts[key] = (counts[key] || 0) + 1;
    if (!lineNumbers[key]) lineNumbers[key] = [];
    lineNumbers[key].push(lineNumber);
  }
  
  Object.keys(counts).forEach(key => {
    if (counts[key] > 1) {
      console.log(`${key}: found ${counts[key]} times at lines ${lineNumbers[key].join(', ')}`);
    }
  });
}

findDupesWithLines(content);
