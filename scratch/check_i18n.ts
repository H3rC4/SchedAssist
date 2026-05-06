
import { translations } from './src/lib/i18n';

const langs = Object.keys(translations);
const allKeys = new Set();
langs.forEach(lang => {
  Object.keys(translations[lang]).forEach(key => allKeys.add(key));
});

langs.forEach(lang => {
  const missing = [];
  allKeys.forEach(key => {
    if (!(key in translations[lang])) {
      missing.push(key);
    }
  });
  if (missing.length > 0) {
    console.log(`Language ${lang} is missing keys:`, missing.join(', '));
  } else {
    console.log(`Language ${lang} has all keys.`);
  }
});
