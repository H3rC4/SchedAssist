const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'src', 'lib', 'i18n', 'general', 'en.ts');
const itPath = path.join(__dirname, '..', 'src', 'lib', 'i18n', 'general', 'it.ts');

// Read the English file
let enContent = fs.readFileSync(enPath, 'utf8');

// Find the start of the object
const startMatch = enContent.match(/export const en_general = \{/);
if (!startMatch) {
  console.error('Could not find start of en_general object in en.ts');
  process.exit(1);
}
const startIndex = startMatch.index + startMatch[0].length;

// Now we need to find the matching closing brace.
let braceCount = 1;
let i = startIndex;
while (i < enContent.length && braceCount > 0) {
  const char = enContent[i];
  if (char === '{') braceCount++;
  if (char === '}') braceCount--;
  i++;
}
if (braceCount !== 0) {
  console.error('Could not find matching closing brace for en_general object');
  process.exit(1);
}
const endIndex = i; // position after the closing brace
const objectContent = enContent.slice(startIndex, endIndex - 1); // exclude the closing brace

// Now create the Italian file content
const itContent = `export const it_general = {\n${objectContent}\n};`;

// Write the Italian file
fs.writeFileSync(itPath, itContent, 'utf8');
console.log(`Copied en_general to it_general in ${itPath}`);