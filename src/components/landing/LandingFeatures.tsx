'use client';

import { MessageCircle, BrainCircuit, BarChart3, CreditCard, ShieldCheck, Zap, Sparkles, LucideIcon } from 'lucide-react';
import { useLandingTranslation } from '@/components/LanguageContext';
import { motion } from 'framer-motion';

const FeatureCard = ({ title, desc, icon: Icon, className, delay }: { title: string, desc: string, icon: LucideIcon, className?: string, delay: number }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        className={`group p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/[0.06] hover:border-accent-500/20 transition-all duration-500 relative overflow-hidden ${className}`}
    >
        <div className="absolute top-0 right-0 h-32 w-32 bg-accent-500/[0.04] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="h-12 w-12 rounded-2xl bg-white/[0.06] flex items-center justify-center mb-6 group-hover:bg-accent-500 group-hover:text-[#090a0d] transition-all duration-500 shadow-xl">
            <Icon className="h-6 w-6 text-white/70 group-hover:text-[#090a0d]" />
        </div>
        
        <h3 className="text-xl font-black text-white mb-3 tracking-tight group-hover:text-accent-400 transition-colors uppercase italic">{title}</h3>
        <p className="text-sm text-white/50 leading-relaxed font-medium">
            {desc}
        </p>

        <div className="absolute inset-0 noise opacity-[0.04] pointer-events-none" />
    </motion.div>
)

export function LandingFeatures() {
  const { t } = useLandingTranslation();

  return (
    <section className="relative z-10 px-6 py-24 bg-[#090a0d]">
      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl text-accent-400 text-[9px] font-black uppercase tracking-[0.2em] mb-6">
            <Sparkles className="h-3 w-3" /> Platform Capabilities
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase italic">
            Everything you need
          </h2>
          <p className="text-white/40 font-medium max-w-2xl mx-auto mt-4">
            From intelligent scheduling to automated payments — run your clinic on autopilot.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            <FeatureCard 
                title={t.feature_1_title} 
                desc={t.feature_1_desc} 
                icon={MessageCircle} 
                className="md:col-span-8 md:row-span-2"
                delay={0}
            />

            <FeatureCard 
                title={t.feature_2_title} 
                desc={t.feature_2_desc} 
                icon={BrainCircuit} 
                className="md:col-span-4"
                delay={0.1}
            />

            <FeatureCard 
                title={t.feature_3_title} 
                desc={t.feature_3_desc} 
                icon={BarChart3} 
                className="md:col-span-4"
                delay={0.2}
            />

            <FeatureCard 
                title={t.feature_4_title || "Stripe Payments"} 
                desc={t.feature_4_desc || "Reduce no-shows by collecting deposits or full payment upfront, automatically."} 
                icon={CreditCard} 
                className="md:col-span-4"
                delay={0.3}
            />

            <FeatureCard 
                title={t.feature_5_title || "Secure Space"} 
                desc={t.feature_5_desc || "Multi-user platform designed for clinics and independent professionals with total privacy."} 
                icon={ShieldCheck} 
                className="md:col-span-4"
                delay={0.4}
            />

            <FeatureCard 
                title={t.feature_6_title || "Automation"} 
                desc={t.feature_6_desc || "Reminders, confirmations and rescheduling without human intervention, 24/7."} 
                icon={Zap} 
                className="md:col-span-4"
                delay={0.5}
            />

        </div>
      </div>
    </section>
  );
}
