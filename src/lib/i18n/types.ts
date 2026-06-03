import { es, it, enUS } from 'date-fns/locale';

export type Language = 'en' | 'es' | 'it';

export const dateLocales = {
  en: enUS,
  es: es,
  it: it
};
