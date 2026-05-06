'use client';

import { useLandingTranslation } from './LanguageContext';
import { Language } from '@/lib/i18n';
import { ChevronDown, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const languages = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLandingTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary/[0.04] border border-primary/10 shadow-sm hover:shadow-md transition-all group"
      >
        <Globe className="h-4 w-4 text-primary/50 group-hover:text-primary transition-colors" />
        <span className="text-sm font-semibold text-primary uppercase tracking-wider">{currentLang.code}</span>
        <ChevronDown className={`h-4 w-4 text-primary/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 rounded-3xl bg-white border border-primary/10 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 space-y-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as Language);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  language === lang.code 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-[#191c1e]/60 hover:bg-primary/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {language === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
