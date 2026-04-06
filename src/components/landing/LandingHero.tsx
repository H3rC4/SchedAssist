'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLandingTranslation } from '@/components/LanguageContext';

export function LandingHero() {
  const { t } = useLandingTranslation();

  return (
    <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-40 pb-24 text-center max-w-7xl mx-auto w-full">
      
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-indigo-100 bg-white dark:bg-slate-900 dark:border-slate-800 text-indigo-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest mb-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
         <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t.hero_badge}
      </div>

      {/* Title */}
      <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.95] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
         {t.hero_title_1} <br />
         <span className="text-amber-500 dark:text-amber-400 drop-shadow-sm">{t.hero_title_2}</span>
      </h1>
      
      {/* Subtitle */}
      <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 leading-relaxed px-4 text-pretty">
         {t.hero_subtitle}
      </p>

      {/* Hero CTA Button (Optimized for First Interaction) */}
      <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
        <Link 
          href="/login" 
          className="px-12 py-6 rounded-[2rem] bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-900 text-lg font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-200 dark:shadow-black/30 hover:scale-105 active:scale-95 flex items-center gap-4 group"
        >
          {t.hero_cta} <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Floating Panel Preview */}
      <div className="mt-20 relative w-full max-w-6xl animate-in fade-in zoom-in duration-1000 delay-500">
         <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent blur-3xl -z-10 rounded-full scale-110 opacity-50" />
         <div className="bg-white dark:bg-slate-900 p-4 rounded-[3rem] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative aspect-[16/9] w-full rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800">
              <Image 
                src="/images/feature_dashboard.png" 
                alt="SaaS Dashboard" 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out-expo" 
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            </div>
         </div>
      </div>
    </main>
  );
}
