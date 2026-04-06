'use client';

import { CalendarDays, Clock, Settings2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLandingTranslation } from '@/components/LanguageContext';

export function LandingCustomization() {
  const { t } = useLandingTranslation();

  const details = [
    {
      title: t.custom_feature_1,
      desc: t.custom_feature_1_desc,
      icon: CalendarDays,
      color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
    },
    {
      title: t.custom_feature_2,
      desc: t.custom_feature_2_desc,
      icon: Clock,
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 group-hover:bg-amber-500 group-hover:text-slate-900'
    },
    {
      title: t.custom_feature_3,
      desc: t.custom_feature_3_desc,
      icon: Settings2,
      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
    }
  ];

  return (
    <section className="relative z-10 px-6 py-32 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
           <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight uppercase italic underline decoration-amber-500 underline-offset-8">
              {t.custom_title}
           </h2>
           <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
              {t.custom_subtitle}
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {details.map((detail, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-indigo-900/5 transition-all group animate-in fade-in duration-700" style={{ animationDelay: `${idx * 200}ms` }}>
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-8 transition-all ${detail.color}`}>
                 <detail.icon className="h-8 w-8" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter italic">{detail.title}</h4>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{detail.desc}</p>
            </div>
          ))}
        </div>

        {/* Final CTA Section */}
        <div className="mt-24 flex flex-col items-center gap-8 animate-in fade-in duration-1000">
           <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-center">
              {t.final_cta}
           </h3>
           <Link 
             href="/login" 
             className="px-12 py-6 rounded-[2rem] bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-900 text-lg font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-200 dark:shadow-black/30 hover:scale-105 active:scale-95 flex items-center gap-4 group"
           >
             {t.hero_cta} <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
           </Link>
        </div>
      </div>
    </section>
  );
}
