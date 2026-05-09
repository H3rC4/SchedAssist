"use client"

import { useState, useEffect } from 'react'
import { 
  Clock, X, Trash2, Coffee, CalendarX, CheckCircle, RefreshCcw, Loader2, 
  ChevronLeft, ChevronRight as ChevronRightIcon, AlertTriangle, Users, 
  ShieldCheck, Mail, ArrowRight, ShieldAlert, ChevronDown, Calendar, 
  Copy, Check, UserPlus, Sparkles, Building, Layers
} from 'lucide-react'
import { Professional, AvailabilityRule, Override } from '@/hooks/useProfessionals'
import { createClient } from '@/lib/supabase/client'
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, parseISO
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useLandingTranslation } from '@/components/LanguageContext'
import { dateLocales } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'

type DrawerMode = 'create' | 'success' | 'edit'

interface ProfessionalDrawerProps {
  mode: DrawerMode
  professional: Professional | null
  onClose: () => void
  activeTab: 'schedule' | 'exceptions' | 'access'
  setActiveTab: (tab: 'schedule' | 'exceptions' | 'access') => void
  editRules: AvailabilityRule[]
  updateRule: (day: number, field: string, value: any) => void
  toggleLunchBreak: (day: number, active: boolean) => void
  overrides: Override[]
  onDelete: () => void
  onSave: (info?: any) => void
  addOverride: (date: string, data: any) => void
  deleteOverride: (id: string) => void
  saving: boolean
  saved: boolean
  locations?: any[]
  onCreate: (data: { full_name: string, specialty: string, location_id?: string }) => Promise<{ success: boolean, prof?: Professional }>
}

export function ProfessionalDrawer({
  mode,
  professional,
  onClose,
  activeTab,
  setActiveTab,
  editRules,
  updateRule,
  toggleLunchBreak,
  overrides,
  onDelete,
  onSave,
  addOverride,
  deleteOverride,
  saving,
  saved,
  locations = [],
  onCreate
}: ProfessionalDrawerProps) {
  const { fullT, language } = useLandingTranslation()
  const T = fullT 
  const currentLocale = dateLocales[language as keyof typeof dateLocales] || es
  
  const days = [
    T.sunday || 'Sunday',
    T.monday || 'Monday',
    T.tuesday || 'Tuesday',
    T.wednesday || 'Wednesday',
    T.thursday || 'Thursday',
    T.friday || 'Friday',
    T.saturday || 'Saturday'
  ]
  
  const [localHint, setLocalHint] = useState(professional?.auth_password_hint || '')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [internalSaving, setInternalSaving] = useState(false)
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)
  
  const [localInfo, setLocalInfo] = useState({
    full_name: professional?.full_name || '',
    specialty: professional?.specialty || '',
    location_id: professional?.location_id || ''
  })

  const [createData, setCreateData] = useState({ full_name: '', specialty: '', location_id: '' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createdProf, setCreatedProf] = useState<Professional | null>(null)

  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [overrideModal, setOverrideModal] = useState<{ date: string } | null>(null)
  const [overrideForm, setOverrideForm] = useState({
    type: 'block' as 'block' | 'open',
    start_time: '09:00',
    end_time: '18:00',
    note: ''
  })
  const [overrideConflicts, setOverrideConflicts] = useState<any[]>([])

  useEffect(() => {
    if (professional) {
      setLocalHint(professional.auth_password_hint || '')
      setLocalInfo({
        full_name: professional.full_name,
        specialty: professional.specialty || '',
        location_id: professional.location_id || ''
      })
    }
  }, [professional])

  useEffect(() => {
    if (mode === 'edit' && professional) {
      setCalendarMonth(new Date())
    }
  }, [mode, professional])

  const getCalendarDays = (month: Date) => {
    const start = startOfWeek(startOfMonth(month))
    const end = endOfWeek(endOfMonth(month))
    return eachDayOfInterval({ start, end })
  }

  const handleOpenOverrideModal = async (dateStr: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('appointments')
      .select('id, start_at, clients(first_name, last_name)')
      .eq('professional_id', professional?.id || createdProf?.id || '')
      .gte('start_at', dateStr)
      .lte('start_at', dateStr + 'T23:59:59')
      .neq('status', 'cancelled')
    
    setOverrideConflicts(data || [])
    setOverrideModal({ date: dateStr })
    setOverrideForm({ type: 'block', start_time: '09:00', end_time: '18:00', note: '' })
  }

  const handleSaveOverride = async () => {
    if (!overrideModal) return
    setInternalSaving(true)
    try {
      if (overrideForm.type === 'block') {
        const supabase = createClient()
        for (const app of overrideConflicts) {
          await supabase.from('appointments').update({ 
            status: 'cancelled', 
            cancellation_notified: false,
            cancellation_reason: 'professional_cancellation' 
          }).eq('id', app.id)
        }
      }
      await (addOverride as any)(overrideModal.date, overrideForm)
      setOverrideModal(null)
    } catch (err: any) {
      console.error(err)
    } finally {
      setInternalSaving(false)
    }
  }

  async function handleResetPassword() {
    if (!professional) return
    setResettingPassword(true)
    try {
      const res = await fetch('/api/professionals/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professional_id: professional.id, tenant_id: professional.tenant_id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error resetting password')
      setLocalHint(data.new_password)
    } catch (err: any) {
      console.error(err)
    } finally {
      setResettingPassword(false)
    }
  }

  const handleCreateAccount = async () => {
    if (!professional) return
    setCreatingAccount(true)
    try {
      const res = await fetch('/api/professionals/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professional_id: professional.id, tenant_id: professional.tenant_id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error creating account')
      setLocalHint(data.auth_password_hint)
      onSave() 
      setActiveTab('access')
    } catch (err: any) {
      console.error(err)
    } finally {
      setCreatingAccount(false)
    }
  }

  const handleConfirmDelete = () => {
    if (window.confirm(T.confirm_delete_prof_long || 'Are you sure you want to delete this professional? This action cannot be undone.')) {
      onDelete()
    }
  }
  
  const copyToClipboard = (text: string, type: 'email' | 'pass') => {
    navigator.clipboard.writeText(text)
    if (type === 'email') {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } else {
      setCopiedPass(true)
      setTimeout(() => setCopiedPass(false), 2000)
    }
  }

  const handleSaveAll = () => {
    onSave(localInfo)
  }

  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createData.full_name) return
    setCreateLoading(true)
    const res = await onCreate(createData)
    if (res.success && res.prof) {
      setCreatedProf(res.prof)
    }
    setCreateLoading(false)
  }

  const handleDeleteOverride = (id: string) => {
    deleteOverride(id)
  }

  const profId = professional?.id || createdProf?.id || ''

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
      />

      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
        className="absolute top-0 right-0 h-full w-full max-w-2xl bg-surface shadow-spatial flex flex-col rounded-l-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ==================== CREATE MODE ==================== */}
        {mode === 'create' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-on-surface/5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.3em]">
                      {T.staff_subtitle}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-on-surface uppercase tracking-tighter">
                    {T.adding_professional || 'Agregar Profesional'}
                  </h2>
                </div>
                <button 
                  onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-muted hover:text-on-surface transition-all active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="create-prof-form" onSubmit={handleCreateProfessional} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.2em] ml-2">
                    {T.fullName}
                  </label>
                  <div className="relative group">
                    <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-muted/40 group-focus-within:text-primary transition-colors" />
                    <input
                      required
                      autoFocus
                      value={createData.full_name}
                      onChange={e => setCreateData({ ...createData, full_name: e.target.value })}
                      className="w-full h-11 bg-surface border border-on-surface/10 rounded-xl pl-11 pr-4 text-sm font-bold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                      placeholder={T.fullNamePH}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.2em] ml-2">
                    {T.specialty}
                  </label>
                  <div className="relative group">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-muted/40 group-focus-within:text-primary transition-colors" />
                    <input
                      value={createData.specialty}
                      onChange={e => setCreateData({ ...createData, specialty: e.target.value })}
                      className="w-full h-11 bg-surface border border-on-surface/10 rounded-xl pl-11 pr-4 text-sm font-bold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                      placeholder={T.specialtyPH}
                    />
                  </div>
                </div>

                {locations.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.2em] ml-2">
                      {T.location_label}
                    </label>
                    <div className="relative group">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-muted/40 group-focus-within:text-primary transition-colors" />
                      <select
                        value={createData.location_id}
                        onChange={e => setCreateData({ ...createData, location_id: e.target.value })}
                        className="w-full h-11 bg-surface border border-on-surface/10 rounded-xl pl-11 pr-10 text-sm font-bold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none"
                      >
                        <option value="">{T.select_location_optional}</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-muted/40 pointer-events-none" />
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-on-surface/5">
              <button
                type="submit"
                form="create-prof-form"
                disabled={createLoading}
                className="w-full py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {createLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>{T.create}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ==================== SUCCESS MODE ==================== */}
        {mode === 'success' && createdProf && (
          <div className="flex flex-col h-full items-center justify-center p-8">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6"
            >
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </motion.div>
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-black text-on-surface uppercase tracking-tighter text-center mb-2"
            >
              {T.professional_created || 'Profesional creado exitosamente'}
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.3em] text-center"
            >
              {createdProf.full_name}
            </motion.p>
          </div>
        )}

        {/* ==================== EDIT MODE ==================== */}
        {mode === 'edit' && professional && (
          <>
            {/* HEADER */}
            <div className="bg-precision-surface-lowest p-4 md:p-6 border-b border-on-surface/5 flex-shrink-0">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center text-white text-xl font-black shadow-spatial">
                    {professional.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-on-surface tracking-tighter leading-none uppercase">
                      {professional.full_name}
                    </h2>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] bg-primary/5 px-3 py-1 rounded-full">
                        {professional.specialty || 'GENERAL'}
                      </span>
                      {locations.find(l => l.id === professional.location_id) && (
                        <span className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.3em]">
                          • {locations.find(l => l.id === professional.location_id)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-muted hover:text-on-surface transition-all active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* TABS */}
              <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl w-fit shadow-inner">
                {[
                  { id: 'schedule', label: T.availability || 'Availability' },
                  { id: 'exceptions', label: T.exceptions || 'Exceptions' },
                  { id: 'access', label: T.auth_access || 'Auth Access' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] transition-all ${
                      activeTab === tab.id 
                        ? 'bg-white text-primary shadow-spatial -translate-y-0.5' 
                        : 'text-on-surface-muted hover:text-on-surface'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-surface">
              <AnimatePresence mode="wait">
                {activeTab === 'schedule' && (
                  <motion.div 
                    key="schedule"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <section className="bg-precision-surface-lowest rounded-xl p-4 md:p-5 border border-on-surface/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.2em] ml-2">
                            {T.fullName || 'Full Name'}
                          </label>
                          <input 
                            type="text"
                            value={localInfo.full_name}
                            onChange={e => setLocalInfo(prev => ({ ...prev, full_name: e.target.value }))}
                            className="w-full h-10 bg-surface border border-on-surface/10 rounded-lg px-4 text-sm font-bold text-on-surface focus:border-primary outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.2em] ml-2">
                            {T.specialty || 'Specialty'}
                          </label>
                          <input 
                            type="text"
                            value={localInfo.specialty}
                            onChange={e => setLocalInfo(prev => ({ ...prev, specialty: e.target.value }))}
                            className="w-full h-10 bg-surface border border-on-surface/10 rounded-lg px-4 text-sm font-bold text-on-surface focus:border-primary outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[8px] font-black text-on-surface-muted uppercase tracking-[0.2em] ml-2">
                            {T.location || 'Primary Location'}
                          </label>
                          <div className="relative">
                            <select 
                              value={localInfo.location_id}
                              onChange={e => setLocalInfo(prev => ({ ...prev, location_id: e.target.value }))}
                              className="w-full h-10 bg-surface border border-on-surface/10 rounded-lg px-4 text-sm font-bold text-on-surface focus:border-primary outline-none transition-all appearance-none pr-10"
                            >
                              <option value="">{T.select_location || 'Select location'}</option>
                              {locations.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-muted pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-xs font-black text-on-surface tracking-tighter uppercase">
                        {T.weekly_availability || 'Weekly Availability'}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {editRules.map((rule) => (
                        <div 
                          key={rule.day_of_week}
                          className={`group transition-all duration-300 rounded-xl border ${
                            rule.active 
                              ? 'bg-white border-primary/20 shadow-sm' 
                              : 'bg-surface-container-low border-on-surface/5 opacity-60'
                          }`}
                        >
                          <div className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => updateRule(rule.day_of_week, 'active', !rule.active)}
                                  className={`relative h-6 w-10 rounded-full transition-colors duration-300 ${
                                    rule.active ? 'bg-primary' : 'bg-on-surface/10'
                                  }`}
                                >
                                  <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform duration-300 ${
                                    rule.active ? 'translate-x-4 shadow-sm' : ''
                                  }`} />
                                </button>
                                <span className={`text-sm font-black tracking-tighter uppercase ${
                                  rule.active ? 'text-on-surface' : 'text-on-surface-muted'
                                }`}>
                                  {days[rule.day_of_week]}
                                </span>
                              </div>

                              {rule.active && (
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg border border-on-surface/5">
                                    <Clock className="h-3 w-3 text-primary" />
                                    <input 
                                      type="time" 
                                      value={rule.start_time.slice(0, 5)}
                                      onChange={e => updateRule(rule.day_of_week, 'start_time', e.target.value + ':00')}
                                      className="bg-transparent border-none p-0 text-[11px] font-black text-on-surface focus:ring-0 outline-none w-20"
                                    />
                                    <span className="text-[8px] font-black text-on-surface-muted">→</span>
                                    <input 
                                      type="time" 
                                      value={rule.end_time.slice(0, 5)}
                                      onChange={e => updateRule(rule.day_of_week, 'end_time', e.target.value + ':00')}
                                      className="bg-transparent border-none p-0 text-[11px] font-black text-on-surface focus:ring-0 outline-none w-20"
                                    />
                                  </div>

                                  <button
                                    onClick={() => updateRule(rule.day_of_week, 'lunch_break_start', rule.lunch_break_start ? null : '13:00:00')}
                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] transition-all border ${
                                      rule.lunch_break_start 
                                        ? 'bg-primary/5 border-primary/20 text-primary' 
                                        : 'bg-surface-container-high border-on-surface/5 text-on-surface-muted hover:text-on-surface'
                                    }`}
                                  >
                                    {rule.lunch_break_start ? (T.remove_break || 'Remove Break') : (T.add_break || 'Add Break')}
                                  </button>
                                </div>
                              )}
                            </div>

                            {rule.active && rule.lunch_break_start && (
                              <div className="mt-4 pt-4 border-t border-on-surface/5">
                                <div className="flex items-center gap-3">
                                  <div className="h-6 w-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                                    <Coffee className="h-3 w-3 text-amber-600" />
                                  </div>
                                  <span className="text-[8px] font-black text-on-surface-muted uppercase tracking-widest">
                                    {T.lunch_break_time || 'Lunch Break Time'}
                                  </span>
                                  <div className="flex items-center gap-2 ml-auto">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low rounded-md border border-on-surface/5">
                                      <input 
                                        type="time" 
                                        value={rule.lunch_break_start.slice(0, 5)}
                                        onChange={e => updateRule(rule.day_of_week, 'lunch_break_start', e.target.value + ':00')}
                                        className="bg-transparent border-none p-0 text-[11px] font-black text-on-surface focus:ring-0 outline-none w-20"
                                      />
                                      <span className="text-[8px] font-black text-on-surface-muted">→</span>
                                      <input 
                                        type="time" 
                                        value={(rule.lunch_break_end || '14:00').slice(0, 5)}
                                        onChange={e => updateRule(rule.day_of_week, 'lunch_break_end', e.target.value + ':00')}
                                        className="bg-transparent border-none p-0 text-[11px] font-black text-on-surface focus:ring-0 outline-none w-20"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'exceptions' && (
                  <motion.div 
                    key="exceptions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-xs font-black text-on-surface tracking-tighter uppercase">
                        {T.manage_exceptions || 'Manage Exceptions'}
                      </h3>
                      <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-lg">
                        <button 
                          onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-surface-container-high text-on-surface-muted transition-all"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-[10px] font-black text-on-surface uppercase tracking-widest px-3">
                          {format(calendarMonth, 'MMMM yyyy', { locale: currentLocale })}
                        </span>
                        <button 
                          onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-surface-container-high text-on-surface-muted transition-all"
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-precision-surface-lowest rounded-xl border border-on-surface/5 overflow-hidden">
                      <div className="grid grid-cols-7 border-b border-on-surface/5">
                        {getCalendarDays(calendarMonth).slice(0, 7).map((day, i) => (
                          <div key={i} className="py-2 text-center text-[8px] font-black text-on-surface-muted uppercase tracking-[0.2em]">
                            {format(day, 'eee', { locale: currentLocale })}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1 p-2 bg-surface-container-low/30">
                        {getCalendarDays(calendarMonth).map((day, i) => {
                          const dateStr = format(day, 'yyyy-MM-dd')
                          const isCurrentMonth = isSameMonth(day, calendarMonth)
                          const hasOverride = overrides.find(o => o.override_date === dateStr)

                          return (
                            <button
                              key={i}
                              onClick={() => isCurrentMonth && handleOpenOverrideModal(dateStr)}
                              disabled={!isCurrentMonth}
                              className={`
                                relative h-10 flex flex-col items-center justify-center rounded-lg transition-all
                                ${!isCurrentMonth ? 'opacity-0 cursor-default pointer-events-none' : 'hover:bg-white hover:shadow-sm'}
                                ${hasOverride 
                                  ? (hasOverride.override_type === 'block' 
                                    ? 'bg-red-500/10 text-red-600 border border-red-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20')
                                  : 'text-on-surface'}
                              `}
                            >
                              <span className="text-xs font-black tracking-tighter">{format(day, 'd')}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {overrides.length > 0 ? (
                        overrides.map(override => (
                          <div 
                            key={override.id}
                            className="group bg-white p-3 rounded-xl border border-on-surface/5 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
                          >
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              override.override_type === 'block' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'
                            }`}>
                              {override.override_type === 'block' ? <ShieldAlert className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-on-surface tracking-tighter uppercase">
                                  {format(parseISO(override.override_date), 'EEEE d MMMM', { locale: currentLocale })}
                                </span>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                  override.override_type === 'block' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'
                                }`}>
                                  {override.override_type === 'block' ? (T.blocked || 'Blocked') : (T.open || 'Open')}
                                </span>
                              </div>
                              {override.start_time && override.end_time && (
                                <div className="flex items-center gap-1.5 mt-1 text-on-surface-muted">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-[10px] font-bold tracking-tight">
                                    {override.start_time.slice(0, 5)} - {override.end_time.slice(0, 5)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => handleDeleteOverride(override.id)}
                              className="h-8 w-8 flex items-center justify-center rounded-md bg-surface-container-low text-on-surface-muted hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center bg-surface-container-low/50 rounded-xl border border-dashed border-on-surface/10">
                          <Calendar className="h-8 w-8 text-on-surface-muted/20 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.2em]">
                            {T.no_exceptions || 'No exceptions configured'}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'access' && (
                  <motion.div 
                    key="access"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {professional.auth_email ? (
                      <div className="bg-white rounded-xl p-6 border border-on-surface/5 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <ShieldCheck className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-on-surface uppercase tracking-tighter">
                              {T.auth_active || 'Authenticated Profile'}
                            </h4>
                            <p className="text-[8px] font-black text-emerald-500 flex items-center gap-1 mt-1 uppercase tracking-widest">
                              <CheckCircle className="h-3 w-3" /> {T.verified || 'Verified'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-precision-surface-lowest rounded-lg p-4 border border-on-surface/5">
                            <span className="text-[8px] font-black text-on-surface-muted uppercase tracking-widest block mb-2 ml-1">
                              {T.login_identifier || 'Login Identifier'}
                            </span>
                            <div className="flex items-center justify-between gap-4">
                               <span className="text-sm font-black text-on-surface break-all">{professional.auth_email}</span>
                               <button 
                                 onClick={() => copyToClipboard(professional.auth_email || '', 'email')}
                                 className={`p-2 rounded-lg transition-all ${copiedEmail ? 'bg-emerald-500/10 text-emerald-600' : 'hover:bg-on-surface/5 text-on-surface-muted hover:text-on-surface'}`}
                               >
                                 {copiedEmail ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                               </button>
                            </div>
                          </div>
                          
                          <div className="bg-precision-surface-lowest rounded-lg p-4 border border-on-surface/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                              <span className="text-[8px] font-black text-on-surface-muted uppercase tracking-widest block mb-2 ml-1">
                                {T.credentials_hint || 'Credentials Hint'}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-black text-primary tracking-widest px-4 py-2 bg-primary/5 rounded-lg block w-fit">
                                  {localHint || '••••••••'}
                                </span>
                                {localHint && (
                                  <button 
                                    onClick={() => copyToClipboard(localHint, 'pass')}
                                    className={`p-2 rounded-lg transition-all ${copiedPass ? 'bg-emerald-500/10 text-emerald-600' : 'hover:bg-on-surface/5 text-on-surface-muted hover:text-on-surface'}`}
                                  >
                                    {copiedPass ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={handleResetPassword}
                              disabled={resettingPassword}
                              className="h-10 px-6 rounded-lg bg-surface border border-on-surface/10 hover:border-primary text-on-surface hover:text-primary text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                              {resettingPassword ? '...' : (T.reset_access || 'Restablecer Acceso')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-precision-surface-lowest rounded-xl border border-dashed border-on-surface/10">
                        <div className="h-14 w-14 rounded-full bg-on-surface/5 flex items-center justify-center mx-auto mb-4">
                          <ShieldAlert className="h-7 w-7 text-on-surface-muted/20" />
                        </div>
                        <h4 className="text-sm font-black text-on-surface uppercase tracking-tighter mb-2">
                          {T.no_auth_profile || 'Sin Perfil de Acceso'}
                        </h4>
                        <p className="text-[10px] font-medium text-on-surface-muted max-w-[280px] mx-auto mb-8">
                          {T.create_auth_desc || 'Este profesional aún no tiene una cuenta de acceso al sistema.'}
                        </p>
                        <button 
                          onClick={handleCreateAccount}
                          disabled={creatingAccount}
                          className="px-8 py-3 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-spatial hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          {creatingAccount ? '...' : (T.create_auth_btn || 'Generate Access Account')}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FOOTER */}
            <div className="p-4 md:p-6 border-t border-on-surface/5 bg-precision-surface-lowest flex flex-col md:flex-row items-center justify-between gap-4">
              <button 
                onClick={handleConfirmDelete}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all uppercase tracking-widest shadow-sm active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
                {T.decommission_profile || 'Decommission Profile'}
              </button>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={onClose}
                  className="flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-on-surface-muted hover:text-on-surface hover:bg-on-surface/5 transition-all"
                >
                  {T.discard || 'Discard'}
                </button>
                <button 
                  onClick={handleSaveAll} 
                  disabled={saving} 
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-sm
                    ${saved ? 'bg-emerald-500 text-white' : 'bg-on-surface text-surface hover:bg-primary hover:text-white'}
                  `}
                >
                  {saved ? (
                    <><CheckCircle className="h-4 w-4" /> <span>{T.sync_complete || 'Sincronizado'}</span></>
                  ) : saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>{T.save_changes || 'Save Changes'} <ArrowRight className="h-4 w-4 ml-1" /></>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* OVERRIDE MODAL */}
        <AnimatePresence>
          {overrideModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={() => setOverrideModal(null)}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="relative bg-white rounded-xl shadow-spatial w-full max-w-md overflow-hidden p-6 md:p-8" 
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest mb-1 block">
                      {T.temporary_shift || 'Temporary Shift'}
                    </span>
                    <h3 className="text-xl font-black text-on-surface tracking-tighter uppercase">
                      {format(parseISO(overrideModal.date), "MMM dd, yyyy", { locale: dateLocales[language] })}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setOverrideModal(null)} 
                    className="h-8 w-8 rounded-lg bg-surface-container-low text-on-surface-muted hover:text-on-surface flex items-center justify-center transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOverrideForm(f => ({ ...f, type: 'block' }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-2 ${
                        overrideForm.type === 'block' 
                          ? 'bg-on-surface text-surface border-on-surface shadow-md scale-[1.02]' 
                          : 'bg-surface text-on-surface-muted border-on-surface/5 hover:border-on-surface/20'
                      }`}
                    >
                      <ShieldAlert className="h-5 w-5" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{T.full_block || 'Full Block'}</span>
                    </button>
                    <button
                      onClick={() => setOverrideForm(f => ({ ...f, type: 'open' }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-2 ${
                        overrideForm.type === 'open' 
                          ? 'bg-primary text-white border-primary shadow-md scale-[1.02]' 
                          : 'bg-surface text-on-surface-muted border-on-surface/5 hover:border-primary/20'
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{T.special_shift || 'Special Shift'}</span>
                    </button>
                  </div>

                  {(overrideForm.type === 'open' || overrideForm.type === 'block') && (
                    <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-lg border border-on-surface/5">
                      <div className="flex-1 text-center">
                         <span className="text-[7px] font-black text-on-surface-muted uppercase tracking-widest block mb-1.5">{T.start || 'START'}</span>
                         <input 
                           type="time" 
                           value={overrideForm.start_time}
                           onChange={e => setOverrideForm(f => ({...f, start_time: e.target.value}))}
                           className="bg-transparent border-none text-center p-0 text-2xl font-black text-on-surface focus:ring-0 w-28 mx-auto block" 
                         />
                      </div>
                      <div className="h-8 w-px bg-on-surface/10 rounded-full" />
                      <div className="flex-1 text-center">
                         <span className="text-[7px] font-black text-on-surface-muted uppercase tracking-widest block mb-1.5">{T.end || 'END'}</span>
                         <input 
                           type="time" 
                           value={overrideForm.end_time}
                           onChange={e => setOverrideForm(f => ({...f, end_time: e.target.value}))}
                           className="bg-transparent border-none text-center p-0 text-2xl font-black text-on-surface focus:ring-0 w-28 mx-auto block" 
                         />
                      </div>
                    </div>
                  )}

                  {overrideConflicts.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 flex gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        {T.warning || 'WARNING'}: {T.danger_appointments_cancelled?.(overrideConflicts.length) || `DANGER: ${overrideConflicts.length} active appointment(s) will be automatically cancelled.`}
                    </div>
                  )}

                  <button 
                    onClick={handleSaveOverride} 
                    disabled={internalSaving}
                    className="w-full py-3 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50 bg-primary text-white hover:bg-primary-dark"
                  >
                    {internalSaving ? '...' : (T.establish_exception || 'Establish Exception')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
