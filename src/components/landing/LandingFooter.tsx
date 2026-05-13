'use client';

import { Logo } from '../Logo';
import { useLandingTranslation } from '../LanguageContext';
import { Sparkles } from 'lucide-react';

export function LandingFooter() {
  const { t } = useLandingTranslation();

  return (
    <footer className="relative z-10 py-24 bg-[#001f1c] px-6 overflow-hidden border-t border-primary/20">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/[0.05] blur-[100px] rounded-full -z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 border-b border-white/5 pb-16 mb-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Logo textColor="text-white" />
            <p className="text-white/40 text-sm font-medium text-center md:text-left max-w-xs leading-relaxed">
              {t.footer_desc || 'Taking appointment automation to the next level with WhatsApp and Artificial Intelligence.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 text-center md:text-left">
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-primary-light uppercase tracking-[0.3em]">{t.footer_product || 'Product'}</h4>
              <ul className="flex flex-col gap-2">
                <li><a href="#features" className="text-white/50 text-xs font-bold hover:text-white transition-colors">{t.footer_features || 'Features'}</a></li>
                <li><a href="#pricing" className="text-white/50 text-xs font-bold hover:text-white transition-colors">{t.footer_pricing || 'Pricing'}</a></li>
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-primary-light uppercase tracking-[0.3em]">{t.footer_legal || 'Legal'}</h4>
              <ul className="flex flex-col gap-2">
                <li><a href="#" className="text-white/50 text-xs font-bold hover:text-white transition-colors">{t.footer_privacy || 'Privacy'}</a></li>
                <li><a href="#" className="text-white/50 text-xs font-bold hover:text-white transition-colors">{t.footer_terms || 'Terms'}</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Sparkles className="h-3 w-3 text-primary-light" />
            <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{t.whatsapp_chat_realtime}</span>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">
              {t.footer_copyright || `© ${new Date().getFullYear()} SchedAssist.`}
            </p>
            <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest">
              Built for modern clinics.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
