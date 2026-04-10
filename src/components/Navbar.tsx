'use client';

import Link from 'next/link';
import { CalendarCheck, ShieldCheck } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useLandingTranslation } from './LanguageContext';
import { Logo } from './Logo';
import { motion } from 'framer-motion';

export function Navbar() {
  const { t } = useLandingTranslation();

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-950/60 backdrop-blur-2xl h-20 rounded-[2.5rem] px-8 flex items-center justify-between border border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative">
          
          {/* Logo */}
          <Link href="/" className="relative z-10 scale-110 md:scale-125 transition-transform origin-left">
            <Logo />
          </Link>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4 relative z-10">
            <LanguageSelector />
            
            <div className="w-px h-8 bg-white/10 mx-2" />

            <Link 
              href="/login" 
              className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-500/10 active:scale-95 flex items-center gap-3"
            >
              {t.nav_login} <ShieldCheck className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex md:hidden items-center gap-2 relative z-10">
             <LanguageSelector />
             <Link 
               href="/login" 
               className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg"
             >
               <ShieldCheck className="h-5 w-5" />
             </Link>
          </div>

          {/* Noise overlay */}
          <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 noise opacity-10" />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
