'use client';

import Link from 'next/link';
import { CalendarCheck, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { useLandingTranslation } from './LanguageContext';

export function Navbar() {
  const { t } = useLandingTranslation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass h-20 rounded-[2.5rem] px-8 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-indigo-900/10 dark:shadow-black/50">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 bg-slate-900 dark:bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/10 group-hover:scale-105 active:scale-95 transition-all duration-300">
              <CalendarCheck className="h-6 w-6 text-amber-400 dark:text-slate-900" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Sched<span className="text-amber-500">Assist</span>
            </span>
          </Link>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector />
            <ThemeToggle />
            
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2" />

            <Link 
              href="/login" 
              className="px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-900 text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/10 hover:shadow-indigo-900/20 active:scale-95 flex items-center gap-3"
            >
              {t.nav_login} <ShieldCheck className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex md:hidden items-center gap-2">
             <LanguageSelector />
             <ThemeToggle />
             <Link 
               href="/login" 
               className="h-10 w-10 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 flex items-center justify-center shadow-lg"
             >
               <ShieldCheck className="h-5 w-5" />
             </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
