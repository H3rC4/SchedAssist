'use client';

import { useState, useEffect } from 'react';
import { Loader2, CreditCard, ShieldCheck, Star, Zap, Crown, ArrowRight, Check, X, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

interface PayPageProps {
  lang?: 'en' | 'es' | 'it'
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    recommended: false,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
    features: ['1 Profesional', '1 Ubicación', '150 Turnos/mes', '200 Pacientes', 'White-label'],
    notIncluded: ['WhatsApp', 'Números ilimitados', 'API Access', 'Analytics avanzada']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    recommended: true,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
    features: ['5 Profesionales', '2 Ubicaciones', 'Turnos ilimitados', 'Pacientes ilimitados', 'WhatsApp incluido', 'White-label'],
    notIncluded: []
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 129,
    recommended: false,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '',
    features: ['Profesionales ilimitados', 'Ubicaciones ilimitadas', 'Turnos ilimitados', 'Pacientes ilimitados', 'WhatsApp + números extra', 'White-label', 'API Access', 'Analytics avanzada'],
    notIncluded: []
  }
]

const translations = {
  es: {
    title: 'Elegí tu plan',
    subtitle: 'Comenzá con 14 días gratis. Cancelá cuando quieras.',
    perMonth: '/mes',
    cta: 'Comenzar',
    popular: 'Más popular',
    included: 'Incluido',
    notIncluded: 'No incluido',
    loading: 'Redirigiendo...',
    error: 'Error al procesar. Intenta de nuevo.'
  },
  en: {
    title: 'Choose your plan',
    subtitle: 'Start with 14 days free. Cancel anytime.',
    perMonth: '/month',
    cta: 'Get Started',
    popular: 'Most popular',
    included: 'Included',
    notIncluded: 'Not included',
    loading: 'Redirecting...',
    error: 'Error processing. Please try again.'
  },
  it: {
    title: 'Scegli il tuo piano',
    subtitle: 'Inizia con 14 giorni gratis. Cancella quando vuoi.',
    perMonth: '/mese',
    cta: 'Inizia',
    popular: 'Più popolare',
    included: 'Incluso',
    notIncluded: 'Non incluso',
    loading: 'Reindirizzamento...',
    error: 'Errore di elaborazione. Riprova.'
  }
}

export default function PayBridgePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'es' | 'it'>('es')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function loadLang() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('tenant_users')
          .select('tenants(settings)')
          .eq('user_id', user.id)
          .limit(1).single()
        if (data?.tenants) {
          const settings = (data.tenants as any).settings
          if (settings?.language) setLang(settings.language)
        }
      }
    }
    loadLang()
  }, [])

  const t = translations[lang] || translations['es']

  async function handleCheckout(planId: string) {
    setLoading(planId)
    setError(null)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || t.error)
        setLoading(null)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(t.error)
      setLoading(null)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/[0.02] blur-[100px] pointer-events-none" />

      <div className="max-w-5xl w-full relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-on-surface uppercase tracking-tight mb-4">
            {t.title}
          </h2>
          <p className="text-lg font-bold text-on-surface-muted uppercase tracking-widest">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-surface-container-lowest rounded-3xl border-2 overflow-hidden ${
                plan.recommended
                  ? 'border-primary shadow-xl shadow-primary/10'
                  : 'border-on-surface/5'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 inset-x-0 bg-primary text-white text-center py-2.5 text-[10px] font-black uppercase tracking-widest">
                  {t.popular}
                </div>
              )}

              <div className={plan.recommended ? 'pt-12' : 'pt-6'}>
                {/* Plan Header */}
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    {plan.id === 'starter' && <Star className="h-5 w-5 text-primary" />}
                    {plan.id === 'pro' && <Zap className="h-5 w-5 text-primary" />}
                    {plan.id === 'premium' && <Crown className="h-5 w-5 text-primary" />}
                    <span className="text-xl font-black text-on-surface uppercase tracking-tight">
                      {plan.name}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-on-surface">${plan.price}</span>
                    <span className="text-sm font-bold text-on-surface-muted uppercase tracking-widest">
                      {t.perMonth}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="px-6 pb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-sm font-bold text-on-surface">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 opacity-50">
                        <div className="h-5 w-5 rounded-full bg-on-surface/5 flex items-center justify-center shrink-0">
                          <X className="h-3 w-3 text-on-surface-muted" />
                        </div>
                        <span className="text-sm font-bold text-on-surface-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loading !== null}
                    className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.recommended
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-light'
                        : 'bg-on-surface/5 text-on-surface hover:bg-on-surface/10'
                    }`}
                  >
                    {loading === plan.id ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {t.loading}</>
                    ) : (
                      <>{t.cta} <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm font-bold text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex items-center justify-center gap-8 text-on-surface-muted"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Pago seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Stripe</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}