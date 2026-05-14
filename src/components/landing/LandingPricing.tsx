'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useLandingTranslation } from '../LanguageContext';
import { MagneticWrapper, TiltCard } from './Animations';

export function LandingPricing() {
  const { t } = useLandingTranslation();

  const plans = [
    {
      name: t.plan_starter || 'Starter',
      price: t.price_starter || '29',
      cta: t.pricing_cta_starter || 'Comenzar',
      features: [
        t.feat_appointments_limit || 'Hasta 100 turnos/mes',
        t.feat_whatsapp_basic || 'WhatsApp básico',
        t.feat_clinical_records || 'Historias clínicas',
        t.feat_email_support || 'Soporte por email',
      ],
      popular: false,
    },
    {
      name: t.plan_pro || 'Pro',
      price: t.price_pro || '49',
      cta: t.pricing_cta_pro || 'Elegir Pro',
      features: [
        t.feat_appointments_unlimited || 'Turnos ilimitados',
        t.feat_whatsapp_ai || 'WhatsApp con IA',
        t.feat_multi_professional || 'Hasta 5 profesionales',
        t.feat_clinical_records || 'Historias clínicas',
        t.feat_priority_support || 'Soporte prioritario',
      ],
      popular: true,
    },
    {
      name: t.plan_premium || 'Premium',
      price: t.price_premium || '99',
      cta: t.pricing_cta_premium || 'Elegir Premium',
      features: [
        t.feat_appointments_unlimited || 'Turnos ilimitados',
        t.feat_whatsapp_ai || 'WhatsApp con IA',
        t.feat_unlimited_professionals || 'Profesionales ilimitados',
        t.feat_custom_domain || 'Dominio personalizado',
        t.feat_priority_support || 'Soporte prioritario',
      ],
      popular: false,
    },
  ];

  const faqItems = [
    {
      q: t.pricing_faq1_q || 'Can I change plans anytime?',
      a: t.pricing_faq1_a || 'Yes, you can upgrade or downgrade your plan anytime.',
    },
    {
      q: t.pricing_faq2_q || 'Do I need a credit card to try?',
      a: t.pricing_faq2_a || 'No. 14-day free trial without entering payment details.',
    },
    {
      q: t.pricing_faq3_q || 'How does technical support work?',
      a: t.pricing_faq3_a || 'We offer email and WhatsApp support. Pro and Premium plans get priority response.',
    },
  ];

  return (
    <section id="pricing" className="relative py-32 bg-white px-6 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[#005c55]/[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#005c55]/[0.03] border border-[#005c55]/10 text-[#005c55] text-[10px] font-black uppercase tracking-[0.3em] mb-6"
          >
            <Sparkles className="h-3 w-3" />
            {t.pricing_badge || 'Pricing'}
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-[#191c1e] tracking-tighter uppercase mb-6"
          >
            {t.pricing_title || 'Simple'} <span className="text-[#005c55] italic">{t.pricing_title_highlight || 'Pricing'}</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#191c1e]/60 max-w-2xl mx-auto"
          >
            {t.pricing_subtitle || 'Empieza gratis. Crece con tu clínica.'}
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-24">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <TiltCard className="h-full">
                <div
                  className={`relative h-full p-8 md:p-12 rounded-[2.5rem] border flex flex-col ${
                    plan.popular 
                      ? 'bg-[#001f1c] border-[#005c55] shadow-2xl shadow-[#005c55]/20 scale-105 z-10' 
                      : 'bg-white border-[#005c55]/10 hover:border-[#005c55]/30 transition-colors'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#005c55] text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                      {t.pricing_most_popular || 'Más popular'}
                    </div>
                  )}

                  <div className="mb-10">
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-6 ${
                      plan.popular ? 'text-[#0d9488]' : 'text-[#005c55]'
                    }`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-5xl font-black tracking-tighter ${
                        plan.popular ? 'text-white' : 'text-[#191c1e]'
                      }`}>
                        ${plan.price}
                      </span>
                      <span className={`text-xs font-bold ${
                        plan.popular ? 'text-white/40' : 'text-[#191c1e]/40'
                      }`}>
                        {t.pricing_period || '/mes'}
                      </span>
                    </div>
                  </div>

                  <ul className="flex flex-col gap-4 mb-12 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                          plan.popular ? 'bg-[#005c55]/20 text-[#0d9488]' : 'bg-[#005c55]/[0.05] text-[#005c55]'
                        }`}>
                          <Check className="h-3 w-3" />
                        </div>
                        <span className={`text-sm font-bold tracking-tight ${
                          plan.popular ? 'text-white/70' : 'text-[#191c1e]/70'
                        }`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <MagneticWrapper>
                    <Link
                      href="/register"
                      className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 group ${
                        plan.popular
                          ? 'bg-[#005c55] text-white shadow-xl shadow-[#005c55]/20 hover:bg-[#0d9488] hover:scale-[1.02]'
                          : 'bg-[#005c55]/[0.03] text-[#005c55] border border-[#005c55]/10 hover:bg-[#005c55]/[0.08] hover:scale-[1.02]'
                      }`}
                    >
                      <span>{plan.cta}</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </MagneticWrapper>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* Integrated FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-4">
                <HelpCircle className="h-4 w-4 text-[#005c55]" />
                <p className="text-[10px] font-black text-[#005c55] uppercase tracking-[0.4em]">{t.pricing_faq_title || 'Common questions'}</p>
              </div>
            </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div key={idx} className="bg-[#f7f9fb] rounded-2xl p-6 border border-[#005c55]/5">
                <h4 className="text-sm font-black text-[#191c1e] mb-2">{item.q}</h4>
                <p className="text-sm text-[#191c1e]/60">{item.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <p className="text-[10px] font-black text-[#005c55]/40 uppercase tracking-[0.4em]">
            {t.pricing_save || 'Ahorrá 20% con pago anual'}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
