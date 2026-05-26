'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';
import { fetchGeoData } from '@/lib/geo';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
  fullT: any;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Load from local storage or detect via IP (cacheado en sessionStorage)
  useEffect(() => {
    const detectLanguage = async () => {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('landing_lang') as Language : null;
      if (saved && ['en', 'es', 'it'].includes(saved)) {
        setLanguage(saved);
        setMounted(true);
        return;
      }

      try {
        // 1. Detectar por configuración del navegador (Prioridad)
        const browserLang = navigator.language.split('-')[0];
        if (['en', 'es', 'it'].includes(browserLang)) {
           setLanguage(browserLang as Language);
        }

        // 2. Refinar por IP (GeoIP) con cacheo en sessionStorage para evitar 429
        const geo = await fetchGeoData();
        if (geo?.country_code) {
          const countryToLang: Record<string, Language> = {
            'AR': 'es', 'ES': 'es', 'MX': 'es', 'CL': 'es', 'CO': 'es', 'UY': 'es', 'PE': 'es', 'EC': 'es', 'VE': 'es',
            'IT': 'it',
            'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en'
          };

          if (countryToLang[geo.country_code]) {
            setLanguage(countryToLang[geo.country_code]);
          }
        }
      } catch (e) {
        console.log('Error detecting language by IP, falling back to browser/default.');
      }
      setMounted(true);
    };

    detectLanguage();
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('landing_lang', lang);
  };

  const fullT = translations[language];
  const t = fullT;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, fullT } as any}>
      <div className={!mounted ? 'invisible' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLandingTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLandingTranslation must be used within a LanguageProvider');
  }
  return context;
}
