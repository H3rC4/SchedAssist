'use client';

import { MessageCircle, BrainCircuit, BarChart3, CreditCard, ShieldCheck, Zap, LucideIcon } from 'lucide-react';
import { useLandingTranslation } from '@/components/LanguageContext';
import { motion } from 'framer-motion';

const FeatureCard = ({ title, desc, icon: Icon, className, delay }: { title: string, desc: string, icon: LucideIcon, className?: string, delay: number }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        className={`group p-8 rounded-[2.5rem] bg-primary-950 border border-slate-200 hover:border-primary-200 transition-all duration-500 relative overflow-hidden ${className}`}
    >
        <div className="absolute top-0 right-0 h-32 w-32 bg-primary-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="h-12 w-12 rounded-2xl bg-primary-light/10 flex items-center justify-center mb-6 group-hover:bg-primary-light group-hover:text-primary-950 transition-all duration-500 shadow-xl">
            <Icon className="h-6 w-6 text-primary-light" />
        </div>
        
        <h3 className="text-xl font-black text-white mb-3 tracking-tight group-hover:text-primary-light transition-colors uppercase italic">{title}</h3>
        <p className="text-sm text-white/70 leading-relaxed font-medium">
            {desc}
        </p>

        <div className="absolute inset-0 noise opacity-10 pointer-events-none" />
    </motion.div>
)

export function LandingFeatures() {
  const { t } = useLandingTranslation();

  return (
    <section className="relative z-10 px-6 py-24 bg-primary-950">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Main Feature: WhatsApp Bot */}
            <FeatureCard 
                title={t.feature_1_title} 
                desc={t.feature_1_desc} 
                icon={MessageCircle} 
                className="md:col-span-8 md:row-span-2"
                delay={0}
            />

            {/* AI Intelligence */}
            <FeatureCard 
                title={t.feature_2_title} 
                desc={t.feature_2_desc} 
                icon={BrainCircuit} 
                className="md:col-span-4"
                delay={0.1}
            />

            {/* Dashboard & Metrics */}
            <FeatureCard 
                title={t.feature_3_title} 
                desc={t.feature_3_desc} 
                icon={BarChart3} 
                className="md:col-span-4"
                delay={0.2}
            />

            {/* Stripe & Payments (New) */}
            <FeatureCard 
                title={t.feature_4_title || "Cobros con Stripe"} 
                desc={t.feature_4_desc || "Reduce ausencias cobrando señas o el total de la cita por adelantado de forma automática."} 
                icon={CreditCard} 
                className="md:col-span-4"
                delay={0.3}
            />

            {/* Security / Multi-tenant */}
            <FeatureCard 
                title={t.feature_5_title || "Espacio Seguro"} 
                desc={t.feature_5_desc || "Plataforma multi-usuario diseñada para clínicas y profesionales independientes con total privacidad."} 
                icon={ShieldCheck} 
                className="md:col-span-4"
                delay={0.4}
            />

            {/* Automation */}
            <FeatureCard 
                title={t.feature_6_title || "Automatización"} 
                desc={t.feature_6_desc || "Recordatorios, confirmaciones y reprogramaciones sin intervención humana, 24/7."} 
                icon={Zap} 
                className="md:col-span-4"
                delay={0.5}
            />

        </div>
      </div>
    </section>
  );
}
