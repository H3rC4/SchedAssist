'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useLandingTranslation } from '../LanguageContext';
import { MagneticWrapper } from './Animations';

export function LandingCTA() {
  const { t } = useLandingTranslation();

  return (
    <section className="relative py-32 bg-[#005c55] px-6 overflow-hidden">
      {/* Animated glow */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 blur-[120px] rounded-full pointer-events-none"
      />
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-[9px] font-black uppercase tracking-[0.2em] mb-8">
            <Sparkles className="h-3 w-3" /> {t.cta_badge}
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter uppercase mb-6 leading-[0.95]">
            {t.cta_title1} <br />
            <span className="italic">{t.cta_title2}</span>
          </h2>
          
          <p className="text-lg text-white/70 max-w-xl mx-auto mb-12">
            {t.cta_subtitle}
          </p>

          <MagneticWrapper>
            <Link 
              href="/register" 
              className="inline-flex items-center gap-4 px-12 py-6 rounded-2xl bg-white text-[#005c55] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-white/20 hover:scale-105 active:scale-95 group"
            >
              {t.final_cta_btn || 'Crear cuenta gratis'} 
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </MagneticWrapper>
        </motion.div>
      </div>
    </section>
  );
}
