'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, ChevronRight, HelpCircle, Globe } from 'lucide-react';
import Link from 'next/link';
import { useLandingTranslation } from '../LanguageContext';
import { MagneticWrapper, TiltCard } from './Animations';
import { PlanTier } from '@/types';
import { fetchGeoData } from '@/lib/geo';

// Pricing config for both markets
const PRICING = {
  AR: {
    currency: 'ARS',
    plans: [
      { tier: 'basic' as PlanTier, monthly: 60000, yearly: 600000, cta: 'Comenzar' },
      { tier: 'pro' as PlanTier, monthly: 90000, yearly: 900000, cta: 'Elegir Pro' },
      { tier: 'premium' as PlanTier, monthly: 195000, yearly: 1950000, cta: 'Elegir Premium' },
    ],
  },
  default: {
    currency: 'USD',
    plans: [
      { tier: 'basic' as PlanTier, monthly: 39, yearly: 390, cta: 'Get Started' },
      { tier: 'pro' as PlanTier, monthly: 59, yearly: 590, cta: 'Choose Pro' },
      { tier: 'premium' as PlanTier, monthly: 129, yearly: 1161, cta: 'Choose Premium' },
    ],
  },
};

const getPlanFeatures = (t: any): Record<PlanTier, string[]> => ({
  basic: [
    t.feat_1_professional || '1 professional',
    t.feat_unlimited_services || 'Unlimited services',
    t.feat_1_location || '1 location',
    t.feat_150_appointments || '150 appointments/month',
    t.feat_200_patients || '200 patients',
    t.feat_whatsapp_included || 'WhatsApp included',
    t.feat_automated_reminders || 'Automated reminders',
    t.feat_basic_clinical_records || 'Basic clinical records',
    t.feat_email_support || 'Email support',
  ],
  pro: [
    t.feat_5_professionals || 'Up to 5 professionals',
    t.feat_unlimited_services || 'Unlimited services',
    t.feat_2_locations || 'Up to 2 locations',
    t.feat_unlimited_appointments || 'Unlimited appointments',
    t.feat_unlimited_patients || 'Unlimited patients',
    t.feat_whatsapp_included || 'WhatsApp included',
    t.feat_automated_reminders || 'Automated reminders',
    t.feat_complete_clinical_records || 'Complete clinical records',
    t.feat_waitlist || 'Waitlist',
    t.feat_api_access || 'API access',
    t.feat_email_support || 'Email support',
  ],
  premium: [
    t.feat_unlimited_professionals || 'Unlimited professionals',
    t.feat_unlimited_services || 'Unlimited services',
    t.feat_unlimited_locations || 'Unlimited locations',
    t.feat_unlimited_appointments || 'Unlimited appointments',
    t.feat_unlimited_patients || 'Unlimited patients',
    t.feat_whatsapp_included || 'WhatsApp included',
    t.feat_automated_reminders || 'Automated reminders',
    t.feat_advanced_clinical_records || 'Advanced clinical records',
    t.feat_waitlist || 'Waitlist',
    t.feat_api_webhooks || 'API + Webhooks',
    t.feat_custom_analytics || 'Custom analytics',
    t.feat_white_label || 'White-label',
    t.feat_email_support || 'Email support',
  ],
});

export function LandingPricing() {
  const { t } = useLandingTranslation();
  const [country, setCountry] = useState<string>('default');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [detectedCountry, setDetectedCountry] = useState<string>('');

  useEffect(() => {
    // Detect country by IP (cacheado en sessionStorage para evitar 429)
    async function detectCountry() {
      try {
        const geo = await fetchGeoData();
        if (geo?.country_code === 'AR') {
          setCountry('AR');
          setDetectedCountry('Argentina');
        }
      } catch {
        // Fallback: default (USD)
      }
    }
    detectCountry();
  }, []);

  const isAR = country === 'AR';
  const pricing = isAR ? PRICING.AR : PRICING.default;

  const formatPrice = (amount: number) => {
    if (isAR) {
      return amount.toLocaleString('es-AR');
    }
    return amount.toString();
  };

  const formatYearlySavings = (monthly: number, yearly: number) => {
    const yearlyEquivalent = monthly * 12;
    const savings = yearlyEquivalent - yearly;
    if (isAR) {
      return `Ahorrá $${savings.toLocaleString('es-AR')} ARS/año`;
    }
    return `Save $${savings}/year`;
  };

  const PLAN_FEATURES = getPlanFeatures(t);
  
  const plans = [
    {
      ...pricing.plans[0],
      name: t.plan_starter || 'Starter',
      features: PLAN_FEATURES.basic,
      popular: false,
    },
    {
      ...pricing.plans[1],
      name: t.plan_pro || 'Pro',
      features: PLAN_FEATURES.pro,
      popular: true,
    },
    {
      ...pricing.plans[2],
      name: t.plan_premium || 'Premium',
      features: PLAN_FEATURES.premium,
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
            className="text-lg text-[#191c1e]/60 max-w-2xl mx-auto mb-8"
          >
            {t.pricing_subtitle || 'Empieza gratis. Crece con tu clínica.'}
          </motion.p>

          {/* Country Selector */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Billing Cycle Toggle */}
            <div className="inline-flex items-center gap-1 p-1 bg-[#f7f9fb] rounded-full border border-[#005c55]/10">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-[#005c55] text-white' 
                    : 'text-[#191c1e]/40 hover:text-[#191c1e]'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  billingCycle === 'yearly' 
                    ? 'bg-[#005c55] text-white' 
                    : 'text-[#191c1e]/40 hover:text-[#191c1e]'
                }`}
              >
                Anual
              </button>
            </div>

            {/* Country Selector */}
            <div className="inline-flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#005c55]" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-[#005c55] border-none outline-none cursor-pointer"
              >
                <option value="default">🌍 International (USD)</option>
                <option value="AR">🇦🇷 Argentina (ARS)</option>
              </select>
              {detectedCountry && (
                <span className="text-[9px] text-[#005c55]/60">
                  (Detectado: {detectedCountry})
                </span>
              )}
            </div>
          </motion.div>
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
                        {pricing.currency === 'ARS' ? '$' : '$'}
                        {formatPrice(billingCycle === 'monthly' ? plan.monthly : plan.yearly)}
                      </span>
                      <span className={`text-xs font-bold ${
                        plan.popular ? 'text-white/40' : 'text-[#191c1e]/40'
                      }`}>
                        {billingCycle === 'monthly' ? '/mes' : '/año'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className={`text-[10px] font-bold mt-2 ${
                        plan.popular ? 'text-emerald-400' : 'text-emerald-600'
                      }`}>
                        {formatYearlySavings(plan.monthly, plan.yearly)}
                      </p>
                    )}
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
                      href={`/register?plan=${plan.tier}&cycle=${billingCycle}&country=${country}`}
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
            {isAR 
              ? 'Precios en pesos argentinos. IVA incluido.' 
              : 'Prices in USD. Taxes may apply depending on your country.'
            }
          </p>
        </motion.div>
      </div>
    </section>
  );
}
