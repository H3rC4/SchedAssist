"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, Star, Zap, Crown, ArrowRight, Check, X } from 'lucide-react'

interface TrialExpiredGateProps {
  lang: 'en' | 'es' | 'it'
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    recommended: false,
    features: ['1 Profesional', '1 Ubicación', '150 Turnos/mes', '200 Pacientes', 'White-label'],
    notIncluded: ['WhatsApp', 'Números ilimitados']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    recommended: true,
    features: ['5 Profesionales', '2 Ubicaciones', 'Turnos ilimitados', 'Pacientes ilimitados', 'WhatsApp incluido', 'White-label'],
    notIncluded: []
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 129,
    recommended: false,
    features: ['Profesionales ilimitados', 'Ubicaciones ilimitadas', 'Turnos ilimitados', 'Pacientes ilimitados', 'WhatsApp + números extra', 'White-label', 'API Access', 'Analytics avanzada'],
    notIncluded: []
  }
]

const translations = {
  es: {
    title: 'Tu trial expiró',
    subtitle: 'Elegí un plan para continuar usando SchedAssist',
    cta: 'Elegir Plan',
    perMonth: '/mes',
    included: 'Incluido',
    notIncluded: 'No incluido'
  },
  en: {
    title: 'Your trial has expired',
    subtitle: 'Choose a plan to continue using SchedAssist',
    cta: 'Choose Plan',
    perMonth: '/month',
    included: 'Included',
    notIncluded: 'Not included'
  },
  it: {
    title: 'Il tuo trial è scaduto',
    subtitle: 'Scegli un piano per continuare a usare SchedAssist',
    cta: 'Scegli Piano',
    perMonth: '/mese',
    included: 'Incluso',
    notIncluded: 'Non incluso'
  }
}

export function TrialExpiredGate({ lang = 'es' }: TrialExpiredGateProps) {
  const router = useRouter()
  const t = translations[lang] || translations['es']
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[200] bg-surface overflow-y-auto">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/[0.03] blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-16 pb-8 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight uppercase mb-4">
            {t.title}
          </h1>
          <p className="text-lg font-bold text-on-surface-muted uppercase tracking-widest max-w-xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>
      </div>

      {/* Plans Grid */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-surface-container-lowest rounded-3xl border-2 overflow-hidden ${
                plan.recommended 
                  ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]' 
                  : 'border-on-surface/5'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 inset-x-0 bg-primary text-white text-center py-2 text-[10px] font-black uppercase tracking-widest">
                  Recomendado
                </div>
              )}

              <div className={plan.recommended ? 'pt-10' : 'pt-6'}>
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {plan.id === 'starter' && <Star className="h-5 w-5 text-primary" />}
                    {plan.id === 'pro' && <Zap className="h-5 w-5 text-primary" />}
                    {plan.id === 'premium' && <Crown className="h-5 w-5 text-primary" />}
                    <span className="text-lg font-black text-on-surface uppercase tracking-tight">
                      {plan.name}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-on-surface">${plan.price}</span>
                    <span className="text-sm font-bold text-on-surface-muted uppercase tracking-widest">
                      {t.perMonth}
                    </span>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-on-surface">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 opacity-50">
                        <div className="h-5 w-5 rounded-full bg-on-surface/5 flex items-center justify-center shrink-0">
                          <X className="h-3 w-3 text-on-surface-muted" />
                        </div>
                        <span className="text-xs font-bold text-on-surface-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() => router.push('/dashboard/pay')}
                    className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
                      plan.recommended
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-light'
                        : 'bg-on-surface/5 text-on-surface hover:bg-on-surface/10'
                    }`}
                  >
                    {t.cta}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}