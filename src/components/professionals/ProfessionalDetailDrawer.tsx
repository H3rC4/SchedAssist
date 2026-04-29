"use client"

import { useState, useEffect } from 'react'
import { Clock, X, Trash2, Coffee, CalendarX, CheckCircle, RefreshCcw, Loader2, ChevronLeft, ChevronRight as ChevronRightIcon, AlertTriangle, Users, ShieldCheck, Mail, ArrowRight } from 'lucide-react'
import { Professional, AvailabilityRule, Override } from '@/hooks/useProfessionals'
import { createClient } from '@/lib/supabase/client'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useLandingTranslation } from '@/components/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'

interface ProfessionalDetailDrawerProps {
  professional: Professional;
  onClose: () => void;
  activeTab: 'schedule' | 'exceptions' | 'access';
  setActiveTab: (tab: 'schedule' | 'exceptions' | 'access') => void;
  editRules: AvailabilityRule[];
  updateRule: (day: number, field: string, value: any) => void;
  toggleLunchBreak: (day: number, active: boolean) => void;
  overrides: Override[];
  onDelete: () => void;
  onSave: (info?: any) => void;
  addOverride: (date: string, data: any) => void;
  deleteOverride: (id: string) => void;
  saving: boolean;
  saved: boolean;
  locations?: any[];
}

export function ProfessionalDetailDrawer({
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
  locations = []
}: ProfessionalDetailDrawerProps) {
  const { fullT } = useLandingTranslation()
  const T = fullT 
  
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  
  const [localHint, setLocalHint] = useState(professional.auth_password_hint)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [internalSaving, setInternalSaving] = useState(false)
  const [creatingAccount, setCreatingAccount] = useState(false)
  
  const [localInfo, setLocalInfo] = useState({
    full_name: professional.full_name,
    specialty: professional.specialty || '',
    location_id: professional.location_id || ''
  })

  useEffect(() => {
    setLocalHint(professional.auth_password_hint)
    setLocalInfo({
      full_name: professional.full_name,
      specialty: professional.specialty || '',
      location_id: professional.location_id || ''
    })
  }, [professional])
  
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [overrideModal, setOverrideModal] = useState<{ date: string } | null>(null)
  const [overrideForm, setOverrideForm] = useState({
    type: 'block' as 'block' | 'open',
    start_time: '09:00',
    end_time: '18:00',
    note: ''
  })
  const [overrideConflicts, setOverrideConflicts] = useState<any[]>([])

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
      .eq('professional_id', professional.id)
      .gte('start_at', dateStr)
      .lte('start_at', dateStr + 'T23:59:59')
      .neq('status', 'cancelled')
    
    setOverrideConflicts(data || [])
    setOverrideModal({ date: dateStr })
    setOverrideForm({
      type: 'block',
      start_time: '09:00',
      end_time: '18:00',
      note: ''
    })
  }

  const handleSaveOverride = async () => {
    if (!overrideModal) return
    setInternalSaving(true)
    try {
      if (overrideForm.type === 'block') {
         const supabase = createClient()
         for (const app of overrideConflicts) {
           await supabase.from('appointments').update({ status: 'cancelled', cancellation_notified: false }).eq('id', app.id)
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
    if (window.confirm('¿Estás seguro de eliminar este profesional? Esta acción no se puede deshacer.')) {
      onDelete()
    }
  }

  const handleSaveAll = () => {
    onSave(localInfo)
  }

  const handleDeleteOverride = (id: string) => {
    deleteOverride(id)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500" />

      <div 
        className="absolute top-0 right-0 h-full w-full max-w-4xl bg-surface shadow-spatial animate-in slide-in-from-right duration-700 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER SECTION */}
        <div className="bg-precision-surface-lowest p-6 md:p-10 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-8">
              <div className="h-20 w-20 rounded-[2rem] bg-primary flex items-center justify-center text-white text-2xl font-black shadow-spatial">
                {professional.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-[0.8] uppercase">
                  {professional.full_name}
                </h2>
                <div className="mt-6 flex items-center gap-4">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] bg-primary/5 px-4 py-1.5 rounded-full">
                    {professional.specialty || 'GENERAL'}
                  </span>
                  {locations.find(l => l.id === professional.location_id) && (
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                      • {locations.find(l => l.id === professional.location_id)?.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="h-12 w-12 flex items-center justify-center rounded-[1.5rem] bg-slate-50 hover:bg-slate-100 text-slate-300 hover:text-slate-900 transition-all active:scale-95"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* ASYMMETRIC TABS */}
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-[2.5rem] w-fit shadow-inner">
            {[
              { id: 'schedule', label: 'Availability' },
              { id: 'exceptions', label: 'Exceptions' },
              { id: 'access', label: 'Auth Access' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-primary shadow-spatial -translate-y-0.5' 
                    : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* BODY SECTION */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'schedule' && (
              <motion.div 
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="grid gap-6">
                  {editRules.map((rule) => (
                    <div key={rule.day_of_week}
                      className={`rounded-[2rem] p-6 transition-all duration-500 border-2 ${
                        rule.active 
                          ? 'bg-white border-slate-100 shadow-spatial' 
                          : 'bg-slate-50/50 border-transparent opacity-50'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-8">
                          <button
                            onClick={() => updateRule(rule.day_of_week, 'active', !rule.active)}
                            className={`relative h-10 w-16 rounded-full transition-colors duration-500 flex items-center p-1 ${rule.active ? 'bg-primary' : 'bg-slate-200'}`}
                          >
                            <div className={`h-8 w-8 bg-white rounded-full shadow-sm transition-transform duration-500 ${rule.active ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                          <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                            {days[rule.day_of_week]}
                          </span>
                        </div>
                        
                        {rule.active && (
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4 bg-slate-50 rounded-[1.5rem] px-8 py-4 shadow-inner">
                              <input 
                                type="time" 
                                value={rule.start_time.slice(0, 5)}
                                onChange={e => updateRule(rule.day_of_week, 'start_time', e.target.value + ':00')}
                                className="bg-transparent border-none p-0 text-xl font-black text-slate-900 focus:ring-0 w-20" 
                              />
                              <span className="text-slate-300 font-black tracking-tighter">—</span>
                              <input 
                                type="time" 
                                value={rule.end_time.slice(0, 5)}
                                onChange={e => updateRule(rule.day_of_week, 'end_time', e.target.value + ':00')}
                                className="bg-transparent border-none p-0 text-xl font-black text-slate-900 focus:ring-0 w-20" 
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {rule.active && (
                        <div className="mt-10 pt-10 border-t border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                          <button
                            onClick={() => toggleLunchBreak(rule.day_of_week, !rule.lunch_break_start)}
                            className={`flex items-center gap-4 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] transition-all ${
                              rule.lunch_break_start 
                                ? 'bg-slate-900 text-white shadow-spatial' 
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            <Coffee className="h-4 w-4" />
                            {rule.lunch_break_start ? 'Break Active' : 'Define Break'}
                          </button>
                          
                          {rule.lunch_break_start && (
                            <div className="flex items-center gap-4 animate-in slide-in-from-left duration-500">
                               <div className="bg-slate-50 rounded-2xl px-6 py-3 flex items-center gap-4 border border-slate-100">
                                  <input type="time" value={rule.lunch_break_start.slice(0, 5)}
                                    onChange={e => updateRule(rule.day_of_week, 'lunch_break_start', e.target.value + ':00')}
                                    className="bg-transparent border-none p-0 text-sm font-black text-primary w-14" />
                                  <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">TO</span>
                                  <input type="time" value={(rule.lunch_break_end || '14:00').slice(0, 5)}
                                    onChange={e => updateRule(rule.day_of_week, 'lunch_break_end', e.target.value + ':00')}
                                    className="bg-transparent border-none p-0 text-sm font-black text-primary w-14" />
                               </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-20 border-t border-slate-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary shadow-inner">
                      <Users className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Core Definition</h3>
                  </div>
                  
                  <div className="grid gap-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] ml-2">Display Name</label>
                        <input 
                          value={localInfo.full_name}
                          onChange={e => setLocalInfo({...localInfo, full_name: e.target.value})}
                          className="w-full h-20 bg-white rounded-[2rem] px-8 text-2xl font-black text-slate-900 border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all shadow-ambient"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] ml-2">Specialization</label>
                        <input 
                          value={localInfo.specialty}
                          onChange={e => setLocalInfo({...localInfo, specialty: e.target.value})}
                          className="w-full h-20 bg-white rounded-[2rem] px-8 text-2xl font-black text-slate-900 border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all shadow-ambient"
                        />
                      </div>
                    </div>
                    {locations.length > 0 && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] ml-2">Default Operation Site</label>
                        <select
                          value={localInfo.location_id}
                          onChange={e => setLocalInfo({...localInfo, location_id: e.target.value})}
                          className="w-full h-20 bg-white rounded-[2rem] px-8 text-xl font-black text-slate-900 border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all shadow-ambient appearance-none"
                        >
                          <option value="">Agnostic (All Locations)</option>
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'exceptions' && (
              <motion.div 
                key="exceptions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-16"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                  <div className="flex items-center gap-4 bg-white p-2.5 rounded-[2.5rem] shadow-spatial border border-slate-50">
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="h-14 w-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-300 hover:text-primary transition-all active:scale-90 flex items-center justify-center">
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <span className="text-lg font-black text-slate-900 uppercase tracking-widest min-w-[180px] text-center">
                      {format(calendarMonth, 'MMMM yyyy', { locale: es })}
                    </span>
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="h-14 w-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-300 hover:text-primary transition-all active:scale-90 flex items-center justify-center">
                      <ChevronRightIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-loose max-w-[240px] text-right">
                    Select a date to define <br/>temporary operational shifts.
                  </p>
                </div>

                <div className="bg-white rounded-[4rem] p-12 md:p-16 shadow-spatial border border-slate-50">
                  <div className="grid grid-cols-7 gap-6 mb-12">
                    {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(d => (
                      <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-6">
                    {getCalendarDays(calendarMonth).map((day, i) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const isToday = isSameDay(day, new Date())
                      const hasOverride = overrides.find(ov => ov.override_date === dateStr)
                      const inMonth = isSameMonth(day, calendarMonth)

                      return (
                        <button
                          key={i}
                          onClick={() => inMonth && handleOpenOverrideModal(dateStr)}
                          disabled={!inMonth}
                          className={`aspect-square flex flex-col items-center justify-center rounded-[2rem] text-xl font-black transition-all relative border-4 border-transparent
                            ${!inMonth ? 'opacity-0 cursor-default pointer-events-none' : ''}
                            ${hasOverride?.override_type === 'block' ? 'bg-slate-900 text-white shadow-spatial scale-110 z-10' : 
                              hasOverride?.override_type === 'open' ? 'bg-primary text-white shadow-spatial scale-110 z-10' :
                              isToday ? 'bg-white text-primary border-primary shadow-ambient' : 'bg-slate-50 text-slate-400 hover:bg-white hover:border-slate-200 hover:shadow-ambient'}
                          `}
                        >
                          {format(day, 'd')}
                          {hasOverride && (
                             <div className="absolute bottom-3 h-1 w-4 rounded-full bg-current opacity-40" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Active Overrides</h3>
                  </div>
                  
                  {overrides.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
                      <CalendarX className="h-16 w-16 text-slate-100 mb-6" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Chronological Void</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {overrides.map(ov => (
                        <div key={ov.id} className="flex items-center justify-between p-10 rounded-[3rem] bg-white border border-slate-100 shadow-ambient group hover:shadow-spatial transition-all duration-500">
                          <div className="flex items-center gap-8">
                            <div className={`h-20 w-20 rounded-[1.75rem] flex items-center justify-center shadow-inner ${ov.override_type === 'block' ? 'bg-slate-900 text-white' : 'bg-primary text-white'}`}>
                              {ov.override_type === 'block' ? <CalendarX className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
                            </div>
                            <div>
                              <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">{format(parseISO(ov.override_date), "MMM dd, yyyy")}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">
                                {ov.override_type === 'block' ? 'FULL BLOCK' : `SHIFT: ${ov.start_time?.slice(0,5)} — ${ov.end_time?.slice(0,5)}`}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteOverride(ov.id)} 
                            className="h-14 w-14 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                          >
                            <Trash2 className="h-6 w-6" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'access' && (
              <motion.div 
                key="access"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl space-y-12"
              >
                {professional.auth_email ? (
                  <div className="bg-white rounded-[4rem] p-12 md:p-20 shadow-spatial border border-slate-50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-20 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                       <ShieldCheck className="h-64 w-64" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-10 mb-16">
                        <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center shadow-inner text-primary">
                          <ShieldCheck className="h-12 w-12" />
                        </div>
                        <div>
                          <h4 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Auth Profile Active</h4>
                          <p className="text-[10px] font-black text-emerald-500 flex items-center gap-2 mt-4 uppercase tracking-[0.4em]">
                            <CheckCircle className="h-4 w-4" /> System Verified
                          </p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="bg-slate-50 rounded-[2.5rem] p-10 shadow-inner group-hover:bg-white transition-all">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] block mb-6 ml-2">Login Identifier</span>
                          <div className="flex items-center justify-between">
                             <span className="text-3xl font-black text-slate-900 tracking-tight break-all">{professional.auth_email}</span>
                             <Mail className="h-8 w-8 text-slate-200" />
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-[2.5rem] p-10 shadow-inner group-hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-10">
                          <div className="flex-1">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] block mb-6 ml-2">Credentials Hint</span>
                            <span className="text-5xl font-black text-primary tracking-[0.1em] px-8 py-3 bg-primary/5 rounded-2xl block w-fit">
                              {localHint || '••••••••'}
                            </span>
                          </div>
                          <button 
                            onClick={handleResetPassword} 
                            disabled={resettingPassword} 
                            className="h-24 w-24 bg-white hover:bg-slate-900 hover:text-white rounded-[2rem] flex items-center justify-center text-slate-400 shadow-spatial transition-all active:scale-95 disabled:opacity-50"
                          >
                            {resettingPassword ? <Loader2 className="h-10 w-10 animate-spin" /> : <RefreshCcw className="h-10 w-10" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-[4rem] p-20 text-center border-4 border-dashed border-slate-100 flex flex-col items-center group transition-all hover:bg-white hover:border-primary/20">
                    <div className="h-40 w-40 bg-white rounded-[3rem] flex items-center justify-center mb-12 shadow-spatial group-hover:scale-110 transition-transform duration-700">
                      <ShieldCheck className="h-20 w-20 text-slate-100 group-hover:text-primary transition-colors" />
                    </div>
                    <h4 className="text-5xl font-black text-slate-900 mb-8 tracking-tighter uppercase leading-none">Account Pending</h4>
                    <p className="text-[10px] font-black text-slate-400 mb-16 max-w-sm leading-loose uppercase tracking-[0.4em]">Authorize this professional to access their precision dashboard.</p>
                    
                    <button 
                      onClick={handleCreateAccount}
                      disabled={creatingAccount}
                      className="group relative flex items-center gap-8 bg-primary text-white text-[10px] font-black uppercase tracking-[0.5em] px-20 py-10 rounded-full shadow-spatial transition-all active:scale-95 disabled:opacity-50"
                    >
                      {creatingAccount ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
                      <span>{creatingAccount ? 'SYNCING...' : 'INITIATE ACCESS'}</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-3 transition-transform" />
                    </button>
                  </div>
                )}

                <div className="pt-20">
                   <button 
                      onClick={handleConfirmDelete}
                      className="flex items-center gap-5 text-[10px] font-black text-slate-200 hover:text-red-500 uppercase tracking-[0.5em] transition-all"
                   >
                      <Trash2 className="h-5 w-5" />
                      Decommission Profile
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="p-6 md:p-8 bg-white/80 backdrop-blur-3xl border-t border-slate-100 flex items-center justify-between flex-shrink-0 z-30">
          <div className="hidden md:flex items-center gap-4">
            <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Synchronizing Precision</span>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto">
            <button 
              onClick={onClose}
              className="flex-1 md:flex-none py-8 px-12 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-all"
            >
              Discard
            </button>
            <button 
              onClick={handleSaveAll} 
              disabled={saving} 
              className={`flex-1 md:flex-none flex items-center justify-center gap-6 py-8 px-20 rounded-full font-black uppercase tracking-[0.4em] text-[10px] transition-all active:scale-95 disabled:opacity-50 shadow-spatial
                ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-primary'}
              `}
            >
              {saved ? (<><CheckCircle className="h-5 w-5" /> <span>Sync Complete</span></>) : saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (<><span>Commit Changes</span> <ArrowRight className="h-5 w-5" /></>)}
            </button>
          </div>
        </div>

        {/* OVERRIDE MODAL */}
        <AnimatePresence>
          {overrideModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={() => setOverrideModal(null)}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-3xl"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white rounded-[4rem] shadow-spatial w-full max-w-xl overflow-hidden p-16 md:p-24" 
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-16">
                  <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block">Temporary Shift</span>
                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                      {format(parseISO(overrideModal.date), "MMM dd")}
                    </h3>
                  </div>
                  <button onClick={() => setOverrideModal(null)} className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-300 hover:text-slate-900 flex items-center justify-center transition-all"><X className="h-8 w-8" /></button>
                </div>

                <div className="space-y-16">
                  <div className="grid grid-cols-2 gap-8">
                    <button
                      onClick={() => setOverrideForm(f => ({ ...f, type: 'block' }))}
                      className={`flex flex-col items-center gap-6 p-12 rounded-[3.5rem] transition-all duration-500 border-4 ${
                        overrideForm.type === 'block' 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-spatial scale-105' 
                          : 'bg-white text-slate-200 border-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <CalendarX className="h-12 w-12" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Full Block</span>
                    </button>
                    <button
                      onClick={() => setOverrideForm(f => ({ ...f, type: 'open' }))}
                      className={`flex flex-col items-center gap-6 p-12 rounded-[3.5rem] transition-all duration-500 border-4 ${
                        overrideForm.type === 'open' 
                          ? 'bg-primary text-white border-primary shadow-spatial scale-105' 
                          : 'bg-white text-slate-200 border-slate-50 hover:border-primary/20'
                      }`}
                    >
                      <Clock className="h-12 w-12" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Special Shift</span>
                    </button>
                  </div>

                  {overrideForm.type === 'open' && (
                    <div className="flex items-center gap-10 bg-slate-50 p-6 rounded-[2.5rem] shadow-inner animate-in slide-in-from-top-6 duration-700">
                      <div className="flex-1 text-center">
                         <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-2">START</span>
                         <input type="time" value={overrideForm.start_time}
                           onChange={e => setOverrideForm(f => ({...f, start_time: e.target.value}))}
                           className="bg-transparent border-none text-center p-0 text-3xl font-black text-slate-900 focus:ring-0 w-full" />
                      </div>
                      <div className="h-12 w-1 px-1 bg-slate-200 rounded-full" />
                      <div className="flex-1 text-center">
                         <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-2">END</span>
                         <input type="time" value={overrideForm.end_time}
                           onChange={e => setOverrideForm(f => ({...f, end_time: e.target.value}))}
                           className="bg-transparent border-none text-center p-0 text-3xl font-black text-slate-900 focus:ring-0 w-full" />
                      </div>
                    </div>
                  )}

                  {overrideConflicts.length > 0 && (
                    <div className="p-10 rounded-[2.5rem] bg-rose-50 border border-rose-100 flex gap-6 animate-in shake duration-500">
                      <AlertTriangle className="h-8 w-8 text-rose-500 flex-shrink-0" />
                      <div className="text-[10px] text-rose-500 font-black leading-loose uppercase tracking-[0.3em]">
                        DANGER: {overrideConflicts.length} active appointment(s) will be automatically cancelled.
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleSaveOverride} 
                    disabled={internalSaving}
                    className="w-full py-10 rounded-full font-black text-[10px] uppercase tracking-[0.5em] transition-all shadow-spatial active:scale-95 disabled:opacity-50 bg-slate-900 text-white hover:bg-primary"
                  >
                    {internalSaving ? 'PROCESSING...' : 'ESTABLISH EXCEPTION'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function AddOverrideForm({ onAdd }: { onAdd: (date: string, data: any) => void }) {
  const [date, setDate] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return
    onAdd(date, { is_available: isAvailable, start_time: startTime, end_time: endTime })
    setDate('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="space-y-6">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] ml-4">Exception Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-20 bg-white rounded-[2rem] px-10 text-xl font-black text-slate-900 border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all shadow-ambient"
          />
        </div>
        
        <div className="flex items-center gap-10 p-10 bg-white rounded-[2.5rem] shadow-ambient border border-slate-50">
          <div className="flex-1">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Availability</p>
             <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter">Is professional operational?</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsAvailable(!isAvailable)}
            className={`h-10 w-16 rounded-full flex items-center p-1 transition-all ${isAvailable ? 'bg-primary' : 'bg-slate-200'}`}
          >
            <div className={`h-8 w-8 bg-white rounded-full shadow-sm transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <AnimatePresence>
          {isAvailable && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-6"
            >
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] ml-4">Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full h-16 bg-white rounded-2xl px-8 text-lg font-black text-slate-900 border-2 border-slate-100 shadow-inner" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] ml-4">End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full h-16 bg-white rounded-2xl px-8 text-lg font-black text-slate-900 border-2 border-slate-100 shadow-inner" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button 
        type="submit"
        className="w-full h-20 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.5em] shadow-spatial hover:bg-primary transition-all active:scale-95"
      >
        Establish Exception
      </button>
    </form>
  )
}
