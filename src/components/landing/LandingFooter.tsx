'use client';

import { Logo } from '../Logo';
import { useLandingTranslation } from '../LanguageContext';
import { Sparkles, Mail, MessageCircle, Github } from 'lucide-react';
import Link from 'next/link';

export function LandingFooter() {
  const { t } = useLandingTranslation();

  return (
    <footer className="relative z-10 py-20 bg-[#191c1e] px-6 overflow-hidden border-t border-white/5">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-[#005c55]/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-1">
            <Logo textColor="text-white" />
            <p className="text-white/40 text-sm font-medium mt-4 leading-relaxed max-w-xs">
              {t.footer_desc || 'La plataforma líder en gestión de turnos médicos con confirmación por WhatsApp.'}
            </p>
            
            <div className="flex items-center gap-2 mt-6">
              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <Mail className="h-4 w-4" />
              </div>
              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <MessageCircle className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[10px] font-black text-[#0d9488] uppercase tracking-[0.3em] mb-6">{t.footer_product || 'Producto'}</h4>
            <ul className="flex flex-col gap-3">
              <li><a href="#features" className="text-white/50 text-sm font-bold hover:text-white transition-colors">{t.footer_features || 'Features'}</a></li>
              <li><a href="#pricing" className="text-white/50 text-sm font-bold hover:text-white transition-colors">{t.footer_pricing || 'Pricing'}</a></li>
              <li><Link href="/register/clinic" className="text-white/50 text-sm font-bold hover:text-white transition-colors">{t.footer_register_clinic}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[10px] font-black text-[#0d9488] uppercase tracking-[0.3em] mb-6">{t.footer_resources}</h4>
            <ul className="flex flex-col gap-3">
              <li><span className="text-white/30 text-sm font-bold cursor-not-allowed">{t.footer_documentation}</span></li>
              <li><span className="text-white/30 text-sm font-bold cursor-not-allowed">{t.footer_guides}</span></li>
              <li><span className="text-white/30 text-sm font-bold cursor-not-allowed">{t.footer_api}</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10px] font-black text-[#0d9488] uppercase tracking-[0.3em] mb-6">{t.footer_legal || 'Legal'}</h4>
            <ul className="flex flex-col gap-3">
              <li><a href="#" className="text-white/50 text-sm font-bold hover:text-white transition-colors">{t.footer_privacy || 'Privacidad'}</a></li>
              <li><a href="#" className="text-white/50 text-sm font-bold hover:text-white transition-colors">{t.footer_terms || 'Términos'}</a></li>
              <li><span className="text-white/50 text-sm font-bold cursor-not-allowed">Cookies</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Sparkles className="h-3 w-3 text-[#0d9488]" />
            <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{t.footer_whatsapp_status}</span>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">
              {t.footer_copyright || `© ${new Date().getFullYear()} SchedAssist. Todos los derechos reservados.`}
            </p>
            <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest">
              {t.footer_built_for_clinics}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
