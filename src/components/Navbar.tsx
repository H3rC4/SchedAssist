'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useLandingTranslation } from './LanguageContext';
import { Logo } from './Logo';
import { motion } from 'framer-motion';
import { MagneticWrapper } from './landing/Animations';

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
        <div className="bg-white/90 backdrop-blur-2xl h-20 rounded-[2.5rem] px-8 flex items-center justify-between border border-[#005c55]/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative">
          
        <MagneticWrapper>
          <Link href="/" className="hover:scale-105 transition-transform active:scale-95 block">
            <Logo />
          </Link>
        </MagneticWrapper>

            <div className="hidden md:flex items-center gap-3 relative z-10">
              <LanguageSelector />
              
              <div className="w-px h-8 bg-[#005c55]/10 mx-1" />

              <Link 
                href="/login" 
                className="px-6 py-3 rounded-2xl text-[#191c1e] text-[10px] font-black uppercase tracking-widest hover:bg-[#005c55]/[0.05] transition-all"
              >
                {t.nav_login || 'Log In'}
              </Link>

              <MagneticWrapper>
                <Link 
                  href="/register" 
                  className="px-8 py-3.5 rounded-2xl bg-[#005c55] hover:bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-[#005c55]/20 active:scale-95"
                >
                  {t.nav_register || 'Register'}
                </Link>
              </MagneticWrapper>
            </div>

           <div className="flex md:hidden items-center gap-2 relative z-10">
              <LanguageSelector />
              <Link 
                href="/login" 
                className="h-10 w-10 rounded-xl text-[#005c55] flex items-center justify-center border border-[#005c55]/20"
              >
                <ShieldCheck className="h-4 w-4" />
              </Link>
              <Link 
                href="/register" 
                className="h-10 w-10 rounded-xl bg-[#005c55] text-white flex items-center justify-center shadow-lg"
              >
                <ShieldCheck className="h-4 w-4" />
              </Link>
           </div>

          <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 noise opacity-[0.02]" />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
