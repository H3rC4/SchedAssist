'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('es');
  const [mounted, setMounted] = useState(false);

  // Load from local storage or detect via IP
  useEffect(() => {
    const detectLanguage = async () => {
      const saved = localStorage.getItem('landing_lang') as Language;
      if (saved && ['en', 'es', 'it'].includes(saved)) {
        setLanguage(saved);
        setMounted(true);
        return;
      }

      try {
        // Intentar detectar por configuración del navegador
        const browserLang = navigator.language.split('-')[0];
        if (['en', 'es', 'it'].includes(browserLang)) {
           setLanguage(browserLang as Language);
        }

        // Refinar por IP (GeoIP)
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const countryToLang: Record<string, Language> = {
          'AR': 'es', 'ES': 'es', 'MX': 'es', 'CL': 'es', 'CO': 'es', 'UY': 'es',
          'IT': 'it',
          'US': 'en', 'GB': 'en', 'CA': 'en'
        };

        if (data.country_code && countryToLang[data.country_code]) {
          setLanguage(countryToLang[data.country_code]);
        }
      } catch (e) {
        console.log('Error detecting language by IP, falling back to browser defaults.');
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
  const t = fullT.landing;

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
