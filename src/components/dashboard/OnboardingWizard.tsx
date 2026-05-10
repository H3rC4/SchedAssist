"use client"

import { useState } from 'react'
import { 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  UserPlus, 
  Sparkles, 
  CheckCircle2, 
  Stethoscope, 
  Briefcase, 
  User, 
  Clock, 
  DollarSign, 
  Building2,
  CalendarCheck,
  Globe,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { translations, Language } from '@/lib/i18n'

interface OnboardingWizardProps {
  tenantId: string
  tenantName?: string
  lang: Language
  onComplete: () => void
}

export function OnboardingWizard({ tenantId, tenantName, lang, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0) // 0: Welcome, 1: Team, 2: Services, 3: Success
  const [loading, setLoading] = useState(false)
  const [currentLang, setCurrentLang] = useState<Language>(lang || 'es')
  const [error, setError] = useState<string | null>(null)

  const [profName, setProfName] = useState('')
  const [profSpecialty, setProfSpecialty] = useState('')
  
  const [serviceName, setServiceName] = useState('')
  const [serviceDuration, setServiceDuration] = useState('30')
  const [servicePrice, setServicePrice] = useState('0')

  const [profId, setProfId] = useState<string | null>(null)
  const [servId, setServId] = useState<string | null>(null)

  const t = translations[currentLang] || translations['es']

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  ]

  async function handleProfessionalSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (profId) {
        const res = await fetch('/api/professionals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: profId,
            tenant_id: tenantId,
            full_name: profName,
            specialty: profSpecialty
          })
        })
        if (res.ok) {
          setStep(2)
        } else {
          const errorData = await res.json()
          setError(errorData.error || 'Error al actualizar profesional.')
        }
      } else {
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
          setProfId(profData.id)
          
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

    // Validation
    const duration = parseInt(serviceDuration)
    const price = parseFloat(servicePrice)

    if (isNaN(duration) || duration <= 0) {
      setError('La duración debe ser un número positivo.')
      setLoading(false)
      return
    }

    if (isNaN(price) || price < 0) {
      setError('El precio debe ser un número válido.')
      setLoading(false)
      return
    }

    try {
      if (servId) {
        const res = await fetch('/api/services', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: servId,
            tenant_id: tenantId,
            name: serviceName,
            duration_minutes: duration,
            price: price
          })
        })
        if (res.ok) {
          setStep(3)
        } else {
          setError('Error al actualizar servicio.')
        }
      } else {
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            name: serviceName,
            duration_minutes: duration,
            price: price,
            active: true
          })
        })
        if (res.ok) {
          const servData = await res.json()
          setServId(servData.id)
          setStep(3)
        } else {
          setError('Error al crear servicio.')
        }
      }
    } catch {
      setError('Problema de red.')
    } finally {
      setLoading(false)
    }
  }

  async function handleFinish() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tenant/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenant_id: tenantId,
          language: currentLang 
        })
      })
      if (res.ok) {
        onComplete()
      } else {
        const data = await res.json()
        setError(data.error || 'Error finalizando onboarding.')
      }
    } catch (e) {
      console.error(e)
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = [
    { icon: Globe, label: t.onboarding.step_0 },
    { icon: UserPlus, label: t.onboarding.step_1 },
    { icon: Sparkles, label: t.onboarding.step_2 },
    { icon: CheckCircle2, label: t.onboarding.step_3 },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-xl px-4 overflow-hidden">
      {/* Decorative Background Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-primary/[0.05] blur-[120px] rounded-full -z-10 pointer-events-none" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-xl bg-surface-container-lowest rounded-[2rem] border border-on-surface/5 shadow-modal overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="p-10 pb-4">
          {/* Progress Indicator */}
          <div className="flex items-center gap-3 mb-10">
            {[0, 1, 2, 3].map((s) => (
              <motion.div
                key={s}
                initial={false}
                animate={{
                  scale: s === step ? 1 : 0.9,
                  backgroundColor: s === step ? 'var(--primary)' : s < step ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(25,28,30,0.05)',
                  flex: s === step ? 2 : 1
                }}
                className="h-1.5 rounded-full transition-all duration-500"
              />
            ))}
          </div>

          {/* Current Step Metadata */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary/40 animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.4em] text-on-surface/40 uppercase">
              {stepLabels[step].label}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`header-${step}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {step === 0 && (
                <h2 className="text-4xl font-black text-on-surface tracking-tighter uppercase leading-[0.9]">
                  Welcome to <br />
                  <span className="text-primary italic font-serif lowercase tracking-normal">
                    {tenantName || 'SchedAssist'}
                  </span>
                </h2>
              )}
              {step === 1 && (
                <h2 className="text-4xl font-black text-on-surface tracking-tighter uppercase leading-[0.9]">
                  {t.onboarding.team_title?.split(' ')[0] || 'Define'} <br />
                  <span className="text-primary italic font-serif lowercase tracking-normal">
                    {t.onboarding.team_title?.split(' ').slice(1).join(' ') || 'your team'}
                  </span>
                </h2>
              )}
              {step === 2 && (
                <h2 className="text-4xl font-black text-on-surface tracking-tighter uppercase leading-[0.9]">
                  {t.onboarding.services_title?.split(' ')[0] || 'Set'} <br />
                  <span className="text-primary italic font-serif lowercase tracking-normal">
                    {t.onboarding.services_title?.split(' ').slice(1).join(' ') || 'your services'}
                  </span>
                </h2>
              )}
              {step === 3 && (
                <h2 className="text-4xl font-black text-on-surface tracking-tighter uppercase leading-[0.9]">
                  {t.onboarding.all_done?.split(' ')[0] || 'Perfect'} <br />
                  <span className="text-primary italic font-serif lowercase tracking-normal">
                    {t.onboarding.all_done?.split(' ').slice(1).join(' ') || 'deployment'}
                  </span>
                </h2>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-10 pt-4 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="p-6 bg-primary/[0.03] border border-primary/10 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      {t.onboarding.select_language || 'Preferencias de Idioma'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {languages.map((langOpt) => (
                      <button
                        key={langOpt.code}
                        onClick={() => setCurrentLang(langOpt.code)}
                        className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                          currentLang === langOpt.code 
                            ? 'bg-white border-primary shadow-xl shadow-primary/5' 
                            : 'bg-transparent border-on-surface/5 hover:bg-on-surface/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{langOpt.flag}</span>
                          <span className={`text-sm font-bold ${currentLang === langOpt.code ? 'text-on-surface' : 'text-on-surface/40'}`}>
                            {langOpt.label}
                          </span>
                        </div>
                        {currentLang === langOpt.code && (
                          <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 border border-on-surface/5 rounded-3xl bg-surface-container-low/30">
                  <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface mb-1">
                      {t.onboarding.identity_shield}
                    </h4>
                    <p className="text-[11px] font-medium text-on-surface/50 leading-relaxed">
                      {t.onboarding.identity_shield_desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleProfessionalSubmit}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2 transition-colors group-focus-within:text-primary">
                      {t.fullName}
                    </label>
                    <div className="relative">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                      <input
                        required
                        autoFocus
                        value={profName}
                        onChange={(e) => setProfName(e.target.value)}
                        placeholder={t.fullNamePH || 'e.g. Dr. Julian Morrow'}
                        className="w-full bg-primary/[0.03] border border-primary/20 rounded-2xl pl-14 pr-6 py-5 text-sm font-bold text-on-surface placeholder:text-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2 transition-colors group-focus-within:text-primary">
                      {t.specialty}
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                      <input
                        required
                        value={profSpecialty}
                        onChange={(e) => setProfSpecialty(e.target.value)}
                        placeholder={t.specialtyPH || 'e.g. Clinical Dermatology'}
                        className="w-full bg-primary/[0.03] border border-primary/20 rounded-2xl pl-14 pr-6 py-5 text-sm font-bold text-on-surface placeholder:text-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3"
                  >
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 text-red-600">
                      <Loader2 className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-black text-red-800 uppercase tracking-widest">{error}</p>
                  </motion.div>
                )}
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleServiceSubmit}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2 transition-colors group-focus-within:text-primary">
                      {t.onboarding.service_name}
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                      <input
                        required
                        autoFocus
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder="e.g. General Consultation"
                        className="w-full bg-primary/[0.03] border border-primary/20 rounded-2xl pl-14 pr-6 py-5 text-sm font-bold text-on-surface placeholder:text-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2 transition-colors group-focus-within:text-primary">
                        {t.onboarding.duration}
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                        <input
                          required
                          type="number"
                          value={serviceDuration}
                          onChange={(e) => setServiceDuration(e.target.value)}
                          className="w-full bg-primary/[0.03] border border-primary/20 rounded-2xl pl-14 pr-6 py-5 text-sm font-bold text-on-surface outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2 transition-colors group-focus-within:text-primary">
                        {t.onboarding.price}
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                        <input
                          required
                          type="number"
                          value={servicePrice}
                          onChange={(e) => setServicePrice(e.target.value)}
                          className="w-full bg-primary/[0.03] border border-primary/20 rounded-2xl pl-14 pr-6 py-5 text-sm font-bold text-on-surface outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3"
                  >
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 text-red-600">
                      <Loader2 className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-black text-red-800 uppercase tracking-widest">{error}</p>
                  </motion.div>
                )}
              </motion.form>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <div className="relative mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                    className="h-24 w-24 bg-primary/10 rounded-3xl flex items-center justify-center"
                  >
                    <CalendarCheck className="h-10 w-10 text-primary" />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-primary/20 rounded-3xl -z-10 blur-xl"
                  />
                </div>
                
                <h3 className="text-2xl font-black text-on-surface uppercase tracking-tighter mb-4">
                  {t.onboarding.operational_pulse_sync?.split(' ')[0]} <br /> <span className="text-primary italic font-serif lowercase tracking-normal">{t.onboarding.operational_pulse_sync?.split(' ').slice(1).join(' ')}</span>
                </h3>
                
                <p className="text-[11px] font-bold text-on-surface/40 uppercase tracking-[0.2em] max-w-xs leading-relaxed">
                  {t.onboarding.finish_desc || 'Environment ready for clinical administration.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-10 border-t border-on-surface/5 bg-surface-container-lowest/80 backdrop-blur-md space-y-4">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.button
                key="btn0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => setStep(1)}
                className="w-full py-5 bg-primary text-white text-xs font-black uppercase tracking-[0.4em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary-light hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group transition-all duration-500"
              >
                <span>{t.onboarding.sync_progress_btn}</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
              </motion.button>
            )}

            {step === 1 && (
              <motion.div 
                key="btn1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <button
                  onClick={handleProfessionalSubmit}
                  disabled={loading || !profName || !profSpecialty}
                  className="w-full py-5 bg-primary text-white text-xs font-black uppercase tracking-[0.4em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary-light hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group transition-all duration-500 disabled:opacity-30 disabled:pointer-events-none"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t.next}</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep(0)}
                  disabled={loading}
                  className="w-full py-2 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.3em] hover:text-primary flex items-center justify-center gap-2 group transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1.5 transition-transform" />
                  <span>{t.back}</span>
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="btn2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <button
                  onClick={handleServiceSubmit}
                  disabled={loading || !serviceName}
                  className="w-full py-5 bg-primary text-white text-xs font-black uppercase tracking-[0.4em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary-light hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group transition-all duration-500 disabled:opacity-30 disabled:pointer-events-none"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t.next}</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="w-full py-2 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.3em] hover:text-primary flex items-center justify-center gap-2 group transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1.5 transition-transform" />
                  <span>{t.back}</span>
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="btn3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full py-5 bg-primary text-white text-xs font-black uppercase tracking-[0.4em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary-light hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group transition-all duration-500 disabled:opacity-30 disabled:pointer-events-none"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t.onboarding.enter_dashboard}</span>
                      <Sparkles className="h-4 w-4 animate-pulse text-primary-400" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="w-full py-2 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.3em] hover:text-primary flex items-center justify-center gap-2 group transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1.5 transition-transform" />
                  <span>{t.back}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
