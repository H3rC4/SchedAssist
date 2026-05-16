export interface CountryConfig {
  name: string;
  timezone: string;
  language: 'es' | 'it' | 'en';
  countryCode: string;
  currency: string;
  flag: string;
  dateFormat: string;
  timeFormat: string;
}

export const COUNTRY_CONFIG: Record<string, CountryConfig> = {
  'AR': {
    name: 'Argentina',
    timezone: 'America/Argentina/Buenos_Aires',
    language: 'es',
    countryCode: '54',
    currency: 'ARS',
    flag: '🇦🇷',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm'
  },
  'ES': {
    name: 'España',
    timezone: 'Europe/Madrid',
    language: 'es',
    countryCode: '34',
    currency: 'EUR',
    flag: '🇪🇸',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm'
  },
  'IT': {
    name: 'Italia',
    timezone: 'Europe/Rome',
    language: 'it',
    countryCode: '39',
    currency: 'EUR',
    flag: '🇮🇹',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm'
  },
  'MX': {
    name: 'México',
    timezone: 'America/Mexico_City',
    language: 'es',
    countryCode: '52',
    currency: 'MXN',
    flag: '🇲🇽',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm'
  },
  'US': {
    name: 'Estados Unidos',
    timezone: 'America/New_York',
    language: 'en',
    countryCode: '1',
    currency: 'USD',
    flag: '🇺🇸',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'hh:mm a'
  },
  'CO': {
    name: 'Colombia',
    timezone: 'America/Bogota',
    language: 'es',
    countryCode: '57',
    currency: 'COP',
    flag: '🇨🇴',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm'
  },
  'CL': {
    name: 'Chile',
    timezone: 'America/Santiago',
    language: 'es',
    countryCode: '56',
    currency: 'CLP',
    flag: '🇨🇱',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm'
  },
  'PE': {
    name: 'Perú',
    timezone: 'America/Lima',
    language: 'es',
    countryCode: '51',
    currency: 'PEN',
    flag: '🇵🇪',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm'
  }
};

export const getCountryConfig = (countryCode: string): CountryConfig => {
  return COUNTRY_CONFIG[countryCode] || COUNTRY_CONFIG['ES'];
};

export const SUPPORTED_COUNTRIES = Object.entries(COUNTRY_CONFIG).map(([code, config]) => ({
  code,
  ...config
}));
