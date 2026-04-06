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

  // Load from local storage if exists
  useEffect(() => {
    const saved = localStorage.getItem('landing_lang') as Language;
    if (saved && ['en', 'es', 'it'].includes(saved)) {
      setLanguage(saved);
    }
    setMounted(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('landing_lang', lang);
  };

  const t = translations[language].landing;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
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
