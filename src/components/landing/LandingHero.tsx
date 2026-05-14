'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, ShieldCheck, Globe, Building, MessageCircle, Bell } from 'lucide-react';
import Link from 'next/link';
import { useLandingTranslation } from '../LanguageContext';
import { MagneticWrapper } from './Animations';
import { DashboardPreview } from './previews/DashboardPreview';

export function LandingHero() {
  const { t } = useLandingTranslation();

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 px-6 overflow-hidden bg-gradient-to-b from-[#f0f9f7] via-white to-white">
      {/* Subtle particle-like dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-[#005c55]/10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Background blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full bg-[#005c55]/[0.03] blur-[120px] rounded-full -z-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#005c55]/[0.02] blur-[100px] rounded-full -z-10" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#005c55]/[0.02] blur-[100px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Content Side */}
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#005c55]/5 border border-[#005c55]/10 text-[#005c55] text-[10px] font-black uppercase tracking-[0.3em] mb-8"
            >
              <Sparkles className="h-3 w-3" />
              {t.hero_badge}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-6xl xl:text-7xl font-black text-[#191c1e] tracking-tighter uppercase mb-6 leading-[0.9]"
            >
              {t.hero_title_1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#005c55] via-[#0d9488] to-[#005c55] italic">
                {t.hero_title_highlight}
              </span> <br />
              {t.hero_title_2}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-[#191c1e]/60 text-base md:text-lg font-medium max-w-xl mb-10 leading-relaxed"
            >
              {t.hero_subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-12"
            >
              <MagneticWrapper>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-10 py-5 bg-[#005c55] text-white text-xs font-black uppercase tracking-[0.4em] transition-all shadow-2xl shadow-[#005c55]/20 hover:bg-[#0d9488] hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-3 group"
                >
                  <span>{t.hero_cta_primary}</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                </Link>
              </MagneticWrapper>

              <MagneticWrapper>
                <Link
                  href="#demo"
                  className="w-full sm:w-auto px-10 py-5 bg-[#005c55]/5 border border-[#005c55]/20 text-[#005c55] text-xs font-black uppercase tracking-[0.4em] transition-all hover:bg-[#005c55]/10 hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-3"
                >
                  <span>{t.hero_cta_secondary}</span>
                </Link>
              </MagneticWrapper>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="flex items-center gap-8"
            >
              {[
                { value: '14d', label: t.hero_stat_trial },
                { value: '0', label: t.hero_stat_setup },
                { value: '24/7', label: t.hero_stat_support },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-black text-[#191c1e] tracking-tighter">{stat.value}</p>
                  <p className="text-[8px] font-black text-[#191c1e]/40 uppercase tracking-[0.2em]">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Demo Side - Browser Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
            className="hidden lg:block perspective-[2000px]"
          >
            <div className="relative group">
              {/* Glow */}
              <div className="absolute inset-0 bg-[#005c55]/10 blur-[80px] rounded-full group-hover:bg-[#005c55]/15 transition-colors duration-700" />
              
              {/* Browser Frame */}
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl shadow-[#005c55]/10 border border-[#005c55]/10 overflow-hidden transform-gpu transition-transform duration-700 group-hover:rotate-1 group-hover:scale-[1.02]">
                {/* Browser Header */}
                <div className="h-8 bg-[#f7f9fb] border-b border-[#005c55]/5 flex items-center px-3 gap-1.5">
                  <div className="flex gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="h-4 bg-white rounded-full border border-[#005c55]/5 flex items-center justify-center">
                      <span className="text-[6px] text-[#191c1e]/30 font-medium">app.schedassist.com/dashboard</span>
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="scale-[0.85] origin-top">
                  <DashboardPreview />
                </div>
              </div>

              {/* Floating notification badges */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 p-3 bg-white backdrop-blur-xl border border-[#005c55]/10 rounded-2xl z-20 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-[#005c55] rounded-full flex items-center justify-center text-white">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-[#191c1e] uppercase tracking-widest">{t.hero_float_whatsapp}</p>
                    <p className="text-[7px] text-[#191c1e]/50 font-bold">{t.hero_float_whatsapp_desc}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-4 -left-4 p-3 bg-[#005c55] backdrop-blur-xl border border-white/20 rounded-2xl z-20 shadow-xl shadow-[#005c55]/20"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-[#005c55]">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white uppercase tracking-widest">{t.hero_float_reminder}</p>
                    <p className="text-[7px] text-white/70 font-bold">{t.hero_float_reminder_desc}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#005c55]/10 to-transparent" />
    </section>
  );
}
