/**
 * Universal phone number normalization.
 * 
 * Goal: a single phone number, no matter how it arrives (Whapi, manual entry,
 * import), is always stored and looked up in the exact same format.
 * 
 * Rules:
 * 1. Strip everything except digits.
 * 2. Remove WhatsApp suffix (@s.whatsapp.net, @g.us).
 * 3. Remove leading 00 (international prefix).
 * 4. If it does NOT already start with the country code, prepend it.
 * 5. Country-specific fixes:
 *    - Argentina (54): mobile numbers need the '9' prefix.
 *      If after '54' there are exactly 10 digits (no 9), insert it.
 *    - Italy (39): no special rules.
 *    - Spain (34): no special rules.
 *    - USA (1): no special rules.
 * 
 * Examples Argentina (countryCode='54'):
 *   '5491161234567'           -> '5491161234567'  (already complete)
 *   '541161234567'            -> '5491161234567'  (missing 9)
 *   '1161234567'              -> '5491161234567'  (missing country + 9)
 *   '91161234567'             -> '5491161234567'  (missing country)
 *   '+54 11 6123-4567'        -> '5491161234567'  (symbols removed + 9 added)
 *   '5491161234567@s.whatsapp.net' -> '5491161234567'
 * 
 * Examples Italy (countryCode='39'):
 *   '393401234567'            -> '393401234567'   (already complete)
 *   '3401234567'              -> '393401234567'   (missing country)
 *   '+39 340 123 4567'        -> '393401234567'   (symbols removed)
 */
export function normalizePhone(phone: string, countryCode?: string): string {
  if (!phone) return '';

  // 1. Strip WhatsApp suffix
  let clean = phone.split('@')[0];

  // 2. Keep only digits
  clean = clean.replace(/\D/g, '');

  // 3. Remove leading 00
  if (clean.startsWith('00')) {
    clean = clean.slice(2);
  }

  // 4. If it does NOT start with the country code, prepend it
  const cc = countryCode || '';
  if (cc && !clean.startsWith(cc)) {
    clean = cc + clean;
  }

  // 5. Country-specific: Argentina mobile numbers need '9' after country code
  if (clean.startsWith('54')) {
    const afterCountry = clean.slice(2); // digits after '54'
    // Argentine mobiles: 54 9 XX XXXX XXXX (11 digits after 54)
    // If we have only 10 digits after 54, the '9' is missing
    if (afterCountry.length === 10 && !afterCountry.startsWith('9')) {
      clean = '549' + afterCountry;
    }
  }

  return clean;
}

/**
 * Infer default country code from tenant settings.
 * Fallbacks: language -> timezone -> '54' (Argentina).
 */
export function inferCountryCode(settings?: Record<string, any>): string {
  if (settings?.default_country_code) {
    return String(settings.default_country_code);
  }

  const lang = (settings?.language as string) || 'es';
  const tz = (settings?.timezone as string) || '';

  // Language-based fallback
  if (lang === 'it') return '39';
  if (lang === 'en') return '1';

  // Spanish: try to guess by timezone
  if (lang === 'es') {
    if (tz.includes('Europe')) return '34'; // Spain
    return '54'; // Argentina / Latin America default
  }

  return '54';
}
