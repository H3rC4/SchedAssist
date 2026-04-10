'use client';

import { CalendarDays, Clock, Settings2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLandingTranslation } from '@/components/LanguageContext';
import { motion } from 'framer-motion';

export function LandingCustomization() {
  const { t } = useLandingTranslation();

  const details = [
    {
      title: t.custom_feature_1,
      desc: t.custom_feature_1_desc,
      icon: CalendarDays,
      color: 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white'
    },
    {
      title: t.custom_feature_2,
      desc: t.custom_feature_2_desc,
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-900'
    },
    {
      title: t.custom_feature_3,
      desc: t.custom_feature_3_desc,
      icon: Settings2,
      color: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white'
    }
  ];

  return (
    <section className="relative z-10 px-6 py-32 overflow-hidden">
      
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-96 bg-indigo-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
           <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight uppercase italic">
              {t.custom_title}
           </h2>
           <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">
              {t.custom_subtitle}
           </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {details.map((detail, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 p-10 rounded-[3.5rem] border border-white/5 hover:border-amber-500/30 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 h-24 w-24 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 shadow-xl ${detail.color}`}>
                 <detail.icon className="h-8 w-8" />
              </div>
              <h4 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter italic">{detail.title}</h4>
              <p className="text-slate-400 font-medium leading-relaxed">{detail.desc}</p>
              
              {/* Noise overlay */}
              <div className="absolute inset-0 noise opacity-10 pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Final CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 flex flex-col items-center gap-10 p-16 rounded-[4rem] bg-gradient-to-br from-indigo-500/10 to-amber-500/10 border border-white/5 text-center relative overflow-hidden"
        >
           <div className="absolute inset-0 noise opacity-10 pointer-events-none" />
           <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase max-w-3xl leading-[0.95]">
              {t.final_cta}
           </h3>
           <Link 
             href="/register" 
             className="px-12 py-6 rounded-[2rem] bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 flex items-center gap-4 group"
           >
             Empieza Ahora <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
           </Link>
        </motion.div>
      </div>
    </section>
  );
}
