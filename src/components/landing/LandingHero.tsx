'use client';

import { ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import Link from 'next/link';
import { useLandingTranslation } from '@/components/LanguageContext';
import { RealisticDashboard } from './RealisticDashboard';
import { WhatsAppChatPreview } from './WhatsAppChatPreview';
import { motion } from 'framer-motion';

export function LandingHero() {
  const { t } = useLandingTranslation();

  return (
    <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-24 text-center max-w-7xl mx-auto w-full overflow-hidden">
      
      {/* Premium Glow Effect Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary-500/10 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Badge */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-white/5 bg-primary-950/50 backdrop-blur-xl text-primary-light text-[10px] font-black uppercase tracking-[0.2em] mb-10 shadow-2xl"
      >
         <Zap className="h-3.5 w-3.5 fill-primary-light" /> {t.hero_badge || "Next-Generation SaaS"}
      </motion.div>

      {/* Title */}
      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.95] mb-8"
      >
         {t.hero_title_1} <br />
         <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-primary-400 drop-shadow-[0_0_15px_rgba(13,148,136,0.3)]">{t.hero_title_2}</span>
      </motion.h1>
      
      {/* Subtitle */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="text-lg text-white/70 max-w-2xl mb-12 leading-relaxed"
      >
         {t.hero_description || t.hero_subtitle}
      </motion.p>

      {/* CTAs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="flex flex-col sm:flex-row items-center gap-4 mb-24"
      >
        <Link 
          href="/register" 
          className="px-10 py-5 rounded-[2rem] bg-primary-light hover:bg-primary-200 text-primary-950 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary-light/20 hover:scale-105 active:scale-95 flex items-center gap-3 group"
        >
          {t.hero_cta_primary || t.hero_cta} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <button className="px-10 py-5 rounded-[2rem] bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
            {t.hero_cta_secondary || "Watch Video Demo"}
        </button>
      </motion.div>

      {/* The "Reality" Section (Floating UI) */}
      <div className="relative w-full max-w-6xl">
          {/* Dashboard Preview */}
          <div className="md:pr-24 lg:pr-32">
             <RealisticDashboard />
          </div>

          {/* Floating WhatsApp Chat (Overlapping) */}
          <div className="absolute invisible md:visible -right-10 top-20 transform rotate-3 z-30 scale-90 md:scale-100 hover:rotate-0 transition-transform duration-500">
             <WhatsAppChatPreview />
          </div>

          {/* Decorative elements */}
          <div className="absolute -z-10 -bottom-20 left-1/2 -translate-x-1/2 w-[120%] h-96 bg-primary-500/5 blur-[120px] rounded-full pointer-events-none" />
      </div>
    </main>
  );
}
