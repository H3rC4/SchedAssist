"use client"

import { useState } from 'react'
import { Loader2, ArrowRight, UserPlus, Sparkles, CheckCircle2, Stethoscope, Briefcase, User, Clock, DollarSign, Building2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { translations, Language } from '@/lib/i18n'

interface OnboardingWizardProps {
  tenantId: string
  lang: Language
  onComplete: () => void
}

export function OnboardingWizard({ tenantId, lang, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [currentLang, setCurrentLang] = useState<Language>(lang || 'es')
  const [error, setError] = useState<string | null>(null)

  const [profName, setProfName] = useState('')
  const [profSpecialty, setProfSpecialty] = useState('')
  
  const [serviceName, setServiceName] = useState('')
  const [serviceDuration, setServiceDuration] = useState('30')
  const [servicePrice, setServicePrice] = useState('0')

  const t = translations[currentLang] || translations['es']

  async function handleProfessionalSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          full_name: profName,
          specialty: profSpecialty
        })
      })
      if (res.ok) {
        const profData = await res.json()
        
        const defaultRules = []
        for (let i = 0; i < 7; i++) {
          defaultRules.push({
            day_of_week: i,
            start_time: '09:00:00',
            end_time: '18:00:00',
            active: i >= 1 && i <= 5
          })
        }
        await fetch('/api/professionals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professional_id: profData.id,
            tenant_id: tenantId,
            rules: defaultRules
          })
        })
        
        setStep(2)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Error al crear profesional.')
      }
    } catch {
      setError('Problema de red.')
    } finally {
      setLoading(false)
    }
  }

  async function handleServiceSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          name: serviceName,
          duration_minutes: serviceDuration,
          price: parseFloat(servicePrice) || 0,
          active: true
        })
      })
      if (res.ok) {
        setStep(3)
      } else {
        setError('Error al crear servicio.')
      }
    } catch {
      setError('Problema de red.')
    } finally {
      setLoading(false)
    }
  }

  async function handleFinish() {
    setLoading(true)
    try {
      const res = await fetch('/api/tenant/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId })
      })
      if (res.ok) {
        onComplete()
      }
    } catch (e) {
      console.error(e)
      onComplete()
    }
  }

  const stepLabels = [
    { icon: UserPlus, label: 'Step 01 / Team' },
    { icon: Sparkles, label: 'Step 02 / Services' },
    { icon: CheckCircle2, label: 'Complete' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/60 backdrop-blur-md px-4" onClick={onComplete}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 pb-0">
          {/* Progress Dots */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                initial={false}
                animate={{
                  scale: s === step ? 1.2 : 1,
                  backgroundColor: s === step ? 'var(--primary)' : s < step ? 'var(--primary)' : 'rgba(25,28,30,0.08)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`h-2 flex-1 rounded-full ${
                  s === step ? 'bg-primary' : s < step ? 'bg-primary/40' : 'bg-on-surface/8'
                }`}
              />
            ))}
          </div>

          {/* Step Label */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.4em] text-on-surface/40 uppercase">
              {stepLabels[step - 1].label}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1-header"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="precision-header text-3xl leading-tight">
                  {t.onboarding.team_title?.split(' ')[0] || 'Setup'} <br />
                  <span className="text-primary italic font-serif lowercase">
                    {t.onboarding.team_title?.split(' ').slice(1).join(' ') || 'your team'}
                  </span>
                </h2>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="step2-header"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="precision-header text-3xl leading-tight">
                  {t.onboarding.services_title?.split(' ')[0] || 'Configure'} <br />
                  <span className="text-primary italic font-serif lowercase">
                    {t.onboarding.services_title?.split(' ').slice(1).join(' ') || 'your services'}
                  </span>
                </h2>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div
                key="step3-header"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="precision-header text-3xl leading-tight">
                  {t.onboarding.all_done?.split(' ')[0] || 'All'} <br />
                  <span className="text-primary italic font-serif lowercase">
                    {t.onboarding.all_done?.split(' ').slice(1).join(' ') || 'done!'}
                  </span>
                </h2>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleProfessionalSubmit}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-on-surface/5 pb-3">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">
                    Professional Data
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">
                      {t.fullName}
                    </label>
                    <div className="relative">
                      <UserPlus className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface/20" />
                      <input
                        required
                        autoFocus
                        value={profName}
                        onChange={(e) => setProfName(e.target.value)}
                        placeholder={t.fullNamePH || 'Dra. María Antonieta'}
                        className="w-full bg-on-surface/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-on-surface placeholder:text-on-surface/30 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">
                      {t.specialty}
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface/20" />
                      <input
                        required
                        value={profSpecialty}
                        onChange={(e) => setProfSpecialty(e.target.value)}
                        placeholder={t.specialtyPH || 'Cardiología'}
                        className="w-full bg-on-surface/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-on-surface placeholder:text-on-surface/30 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3">
                    <Loader2 className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{error}</p>
                  </div>
                )}
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleServiceSubmit}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-on-surface/5 pb-3">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">
                    Service Configuration
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">
                      {t.onboarding.service_name}
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface/20" />
                      <input
                        required
                        autoFocus
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder="Consulta General"
                        className="w-full bg-on-surface/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-on-surface placeholder:text-on-surface/30 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">
                        {t.onboarding.duration}
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface/20" />
                        <input
                          required
                          type="number"
                          value={serviceDuration}
                          onChange={(e) => setServiceDuration(e.target.value)}
                          placeholder="30"
                          className="w-full bg-on-surface/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-on-surface placeholder:text-on-surface/30 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">
                        {t.onboarding.price}
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface/20" />
                        <input
                          required
                          type="number"
                          value={servicePrice}
                          onChange={(e) => setServicePrice(e.target.value)}
                          placeholder="0"
                          className="w-full bg-on-surface/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-on-surface placeholder:text-on-surface/30 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3">
                    <Loader2 className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{error}</p>
                  </div>
                )}
              </motion.form>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs font-bold text-on-surface/50 uppercase tracking-widest mb-2"
                >
                  {t.onboarding.finish_desc || 'Your clinic is ready to operate'}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-on-surface/5 bg-surface-container-lowest/80 backdrop-blur-md">
          {step === 1 && (
            <button
              onClick={handleProfessionalSubmit}
              disabled={loading || !profName || !profSpecialty}
              className="w-full py-5 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.4em] shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-500 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{t.tutorial.next}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleServiceSubmit}
              disabled={loading || !serviceName}
              className="w-full py-5 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.4em] shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-500 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{t.tutorial.next}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.4em] shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-500 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>{t.onboarding.enter_dashboard}</span>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
