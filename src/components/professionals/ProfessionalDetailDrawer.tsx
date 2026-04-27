"use client"

import { useState, useEffect } from 'react'
import { Clock, Save, X, Trash2, Coffee, CalendarX, CheckCircle, RefreshCcw, Loader2, ChevronLeft, ChevronRight as ChevronRightIcon, AlertTriangle, Users, ShieldCheck } from 'lucide-react'
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
  addMonths, 
  subMonths,
  parseISO
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useLandingTranslation } from '@/components/LanguageContext'

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
  onSave: () => void;
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
  // fullT contiene las traducciones completas (root), t solo landing.
  const { fullT } = useLandingTranslation()
  const T = fullT // Alias corto para facilitar el código
  
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  
  const [localHint, setLocalHint] = useState(professional.auth_password_hint)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [internalSaving, setInternalSaving] = useState(false)
  
  const [localInfo, setLocalInfo] = useState({
    full_name: professional.full_name,
    specialty: professional.specialty || '',
    location_id: professional.location_id || ''
  })

  // Sync local hint when professional prop changes (e.g. after refresh)
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

      // Pasar el objeto entero con nota, horas y tipo
      await (addOverride as any)(overrideModal.date, overrideForm)
      setOverrideModal(null)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error saving exception')
    } finally {
      setInternalSaving(false)
    }
  }

  const handleDeleteOverride = async (id: string) => {
    deleteOverride(id)
  }

  async function handleResetPassword() {
    if (!confirm(T.confirm_reset_pass)) return;
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
      alert(T.success + ': ' + data.new_password)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setResettingPassword(false)
    }
  }

  const [creatingAccount, setCreatingAccount] = useState(false)

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
      alert(`${T.success}!\n${T.access_email}: ${data.auth_email}\nPass: ${data.auth_password_hint}`)
      onSave() 
      setActiveTab('access')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCreatingAccount(false)
    }
  }

  const handleConfirmDelete = () => {
     if (confirm(T.confirm_delete_prof)) {
        onDelete()
     }
  }

  const handleSaveAll = () => {
    const save = onSave as any
    save(localInfo)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-2 md:p-4" onClick={onClose}>
      <div className="bg-primary-950/80 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-transparent border-b border-white/10 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-[#0B1120] border-2 border-accent-500/30 flex items-center justify-center text-white text-lg md:text-xl font-black shadow-[0_0_15px_rgba(245,158,11,0.2)] flex-shrink-0">
              {professional.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <h3 className="text-base md:text-xl font-black text-white truncate tracking-tight uppercase">{professional.full_name}</h3>
              <p className="text-accent-500 font-bold text-[10px] md:text-xs truncate uppercase tracking-widest">{professional.specialty || 'General'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 flex-shrink-0 ml-2 transition-colors">
            <X className="h-5 w-5 md:h-6 md:w-6 text-primary-400" />
          </button>
        </div>

        {/* Tabs - Solo Texto por petición del usuario */}
        <div className="flex border-b border-white/10 px-4 md:px-8 bg-transparent z-20 sticky top-0">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'schedule' ? 'border-accent-500 text-accent-500' : 'border-transparent text-primary-400 hover:text-white'
            }`}
          >
            {T.tab_weekly_config}
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'exceptions' ? 'border-accent-500 text-accent-500' : 'border-transparent text-primary-400 hover:text-white'
            }`}
          >
            {T.tab_exceptions}
            {overrides.length > 0 && (
              <span className="bg-accent-500 text-primary-950 text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">{overrides.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'access' ? 'border-accent-500 text-accent-500' : 'border-transparent text-primary-400 hover:text-white'
            }`}
          >
            {T.tab_access}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
          
          {activeTab === 'access' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
               {professional.auth_email ? (
                <div className="bg-[#0B1120] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 bg-primary-900/40 rounded-2xl flex items-center justify-center border border-accent-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                      <ShieldCheck className="h-6 w-6 text-accent-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">{T.access_title}</h4>
                      <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Portal del Profesional Activo</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-primary-900/40 rounded-2xl p-6 border border-white/5 transition-all hover:border-accent-500/30">
                      <span className="text-[10px] font-black text-primary-400 uppercase block mb-2">{T.access_email}</span>
                      <span className="text-base font-bold text-white break-all">{professional.auth_email}</span>
                    </div>
                    <div className="bg-primary-900/40 rounded-2xl p-6 border border-white/5 transition-all hover:border-accent-500/30 flex items-center justify-between group">
                      <div>
                        <span className="text-[10px] font-black text-primary-400 uppercase block mb-2">{T.access_pass}</span>
                        <span className="text-base font-mono font-black text-accent-500">{localHint ? localHint : T.access_pass_hint}</span>
                      </div>
                      <button 
                        onClick={handleResetPassword} 
                        disabled={resettingPassword} 
                        className="p-4 bg-[#0B1120] hover:bg-accent-500/10 rounded-2xl text-primary-400 hover:text-accent-500 transition-all active:scale-95 border border-white/5 hover:border-accent-500/30"
                        title={T.access_reset_btn}
                      >
                        {resettingPassword ? <Loader2 className="h-6 w-6 animate-spin text-accent-500" /> : <RefreshCcw className="h-6 w-6" />}
                      </button>
                    </div>
                  </div>
                </div>
               ) : (
                <div className="bg-[#0B1120] border-2 border-dashed border-white/10 rounded-[3rem] p-12 text-center group">
                  <div className="h-20 w-20 bg-primary-900/40 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:border-accent-500/30 group-hover:scale-110 transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <ShieldCheck className="h-10 w-10 text-primary-400 group-hover:text-accent-500 transition-colors" />
                  </div>
                  <h4 className="text-lg font-black text-white mb-2 tracking-tight">{T.access_no_account}</h4>
                  <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-8 max-w-xs mx-auto">{T.access_no_account_desc}</p>
                  <button 
                    onClick={handleCreateAccount}
                    disabled={creatingAccount}
                    className="bg-accent-500 inline-flex items-center gap-2 text-primary-950 text-xs font-black uppercase tracking-[0.2em] px-10 py-5 rounded-2xl hover:bg-accent-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {creatingAccount ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                    <span>{creatingAccount ? '...' : T.access_generate_btn}</span>
                  </button>
                </div>
               )}
            </div>
          )}

          {activeTab === 'exceptions' && (
            <div className="space-y-6">
                <div className="bg-[#0B1120] rounded-3xl border border-white/10 p-6 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xs font-black text-primary-400 uppercase tracking-widest flex items-center gap-2">
                        {T.tab_exceptions}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="p-2 rounded-xl hover:bg-white/10 text-primary-400 hover:text-white transition-colors">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-black text-white capitalize min-w-[120px] text-center">
                          {format(calendarMonth, 'MMMM yyyy', { locale: es })}
                        </span>
                        <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="p-2 rounded-xl hover:bg-white/10 text-primary-400 hover:text-white transition-colors">
                          <ChevronRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-primary-400/50 uppercase py-2">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
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
                            className={`aspect-square flex flex-col items-center justify-center rounded-2xl text-[11px] font-black transition-all relative border-2
                              ${!inMonth ? 'opacity-0 cursor-default pointer-events-none' : ''}
                              ${hasOverride?.override_type === 'block' ? 'bg-red-500/20 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 
                                hasOverride?.override_type === 'open' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]' :
                                isToday ? 'bg-accent-500/20 border-accent-500/50 text-accent-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-primary-900/40 border-white/5 text-primary-300 hover:bg-white/10 hover:text-white'}
                            `}
                          >
                            {format(day, 'd')}
                          </button>
                        )
                      })}
                    </div>
                </div>

                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between px-1">
                    <h5 className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Excepciones Activas</h5>
                    <span className="text-[10px] font-black text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded-full">{overrides.length} total</span>
                  </div>
                  {overrides.length === 0 ? (
                    <div className="text-center py-12 text-primary-400/50 italic text-sm border-2 border-dashed border-white/10 rounded-3xl">No hay excepciones guardadas.</div>
                  ) : (
                    <div className="grid gap-3">
                      {overrides.map(ov => (
                        <div key={ov.id} className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#0B1120] shadow-sm hover:border-accent-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${ov.override_type === 'block' ? 'bg-red-500/10 text-red-400' : 'bg-accent-500/10 text-accent-500'}`}>
                              {ov.override_type === 'block' ? <CalendarX className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-white">{format(parseISO(ov.override_date), "d 'de' MMMM", { locale: es })}</p>
                              <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">
                                {ov.override_type === 'block' ? 'Bloqueado TOTAL' : `${ov.start_time?.slice(0,5)} - ${ov.end_time?.slice(0,5)}`}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteOverride(ov.id)} className="p-3 text-primary-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-8">
                <div className="space-y-6">
                <h4 className="text-xs font-black text-primary-400 uppercase tracking-widest">
                  {T.tab_weekly_config}
                </h4>
                <div className="grid gap-3 md:gap-4">
                  {editRules.map((rule) => (
                    <div key={rule.day_of_week}
                      className={`rounded-2xl border transition-all ${rule.active ? 'border-accent-500/30 bg-primary-900/40 shadow-sm' : 'border-white/5 bg-transparent opacity-60'}`}>
                      <div className="flex items-center gap-4 p-4">
                        <label className="flex items-center gap-3 cursor-pointer min-w-[120px]">
                          <input type="checkbox" checked={rule.active}
                            onChange={e => updateRule(rule.day_of_week, 'active', e.target.checked)}
                            className="w-4 h-4 rounded-lg border-white/10 bg-primary-950/80 text-accent-500 focus:ring-accent-500" />
                          <span className={`text-sm font-bold ${rule.active ? 'text-white' : 'text-primary-400'}`}>
                            {days[rule.day_of_week]}
                          </span>
                        </label>
                        
                        {rule.active && (
                          <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                            <input type="time" value={rule.start_time.slice(0, 5)}
                              onChange={e => updateRule(rule.day_of_week, 'start_time', e.target.value + ':00')}
                              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-accent-500 outline-none bg-primary-950/80 text-white" />
                            <span className="text-primary-400 font-bold">→</span>
                            <input type="time" value={rule.end_time.slice(0, 5)}
                              onChange={e => updateRule(rule.day_of_week, 'end_time', e.target.value + ':00')}
                              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-accent-500 outline-none bg-primary-950/80 text-white" />
                          </div>
                        )}
                      </div>

                      {rule.active && (
                        <div className="px-4 pb-4 animate-in fade-in duration-300">
                          <div className="flex items-center gap-4 bg-accent-500/10 border border-accent-500/20 rounded-xl px-4 py-3">
                            <label className="flex items-center gap-2 cursor-pointer text-[10px] text-accent-500 font-black uppercase tracking-widest whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={!!rule.lunch_break_start}
                                onChange={e => toggleLunchBreak(rule.day_of_week, e.target.checked)}
                                className="w-4 h-4 rounded-md border-accent-500/30 bg-primary-950/80 text-accent-500 focus:ring-accent-400"
                              />
                              <Coffee className="h-3.5 w-3.5" /> Pausa
                            </label>
                            
                            {rule.lunch_break_start && (
                               <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                                <span className="text-[10px] text-accent-500 font-black uppercase">De</span>
                                <input type="time" value={rule.lunch_break_start.slice(0, 5)}
                                  onChange={e => updateRule(rule.day_of_week, 'lunch_break_start', e.target.value + ':00')}
                                  className="rounded-lg border border-accent-500/30 px-2 py-1.5 text-[11px] font-bold focus:ring-2 focus:ring-accent-400 outline-none bg-primary-950/80 text-white w-20" />
                                <span className="text-[10px] text-accent-500 font-black uppercase">A</span>
                                <input type="time" value={(rule.lunch_break_end || '14:00').slice(0, 5)}
                                  onChange={e => updateRule(rule.day_of_week, 'lunch_break_end', e.target.value + ':00')}
                                  className="rounded-lg border border-accent-500/30 px-2 py-1.5 text-[11px] font-bold focus:ring-2 focus:ring-accent-400 outline-none bg-primary-950/80 text-white w-20" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                </div>

                <div className="bg-[#0B1120] rounded-3xl p-8 border border-white/10 space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-primary-900/40 border border-white/5 rounded-2xl flex items-center justify-center shadow-sm text-primary-400">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Información de Perfil</p>
                      <p className="text-xl font-black text-white">{localInfo.full_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-2">Nombre Completo</label>
                      <input 
                        value={localInfo.full_name}
                        onChange={e => setLocalInfo({...localInfo, full_name: e.target.value})}
                        className="w-full rounded-xl bg-primary-950/80 border border-white/10 px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-accent-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-2">Especialidad</label>
                      <input 
                        value={localInfo.specialty}
                        onChange={e => setLocalInfo({...localInfo, specialty: e.target.value})}
                        className="w-full rounded-xl bg-primary-950/80 border border-white/10 px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-accent-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {locations.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-2">Sede Asignada</label>
                      <select
                        value={localInfo.location_id}
                        onChange={e => setLocalInfo({...localInfo, location_id: e.target.value})}
                        className="w-full rounded-xl bg-primary-950/80 border border-white/10 px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-accent-500 outline-none transition-all"
                      >
                        <option value="" className="bg-primary-950">Ninguna / Rotativo</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id} className="bg-primary-950">{loc.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-6 border-t border-white/10 flex gap-4 md:gap-6 flex-shrink-0 bg-transparent">
          <button 
             onClick={handleConfirmDelete} 
             className="p-4 rounded-2xl border border-white/5 text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all active:scale-95 shadow-sm group"
             title={T.delete}
          >
            <Trash2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </button>
          
          <button 
            onClick={handleSaveAll} 
            disabled={saving} 
            className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-accent-500 text-primary-950 font-black uppercase tracking-widest hover:bg-accent-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 transition-all active:scale-95 px-6"
          >
            {saved ? (<><CheckCircle className="h-6 w-6" /> <span>{T.saved_success}</span></>) : saving ? <Loader2 className="h-6 w-6 animate-spin" /> : (<><Save className="h-6 w-6" /> <span>{T.save_changes}</span></>)}
          </button>
        </div>

        {/* Override Modal */}
        {overrideModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4" onClick={() => setOverrideModal(null)}>
            <div className="bg-primary-950/90 border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {format(parseISO(overrideModal.date), "d 'de' MMMM", { locale: es })}
                  </h3>
                  <button onClick={() => setOverrideModal(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X className="h-5 w-5 text-primary-400" /></button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOverrideForm(f => ({ ...f, type: 'block' }))}
                      className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        overrideForm.type === 'block' ? 'border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/5 text-primary-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <CalendarX className="h-4 w-4" /> Bloquear
                    </button>
                    <button
                      onClick={() => setOverrideForm(f => ({ ...f, type: 'open' }))}
                      className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        overrideForm.type === 'open' ? 'border-accent-500/50 bg-accent-500/10 text-accent-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-white/5 text-primary-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <Clock className="h-4 w-4" /> Especial
                    </button>
                  </div>

                  {overrideForm.type === 'open' && (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <input type="time" value={overrideForm.start_time}
                        onChange={e => setOverrideForm(f => ({...f, start_time: e.target.value}))}
                        className="flex-1 rounded-2xl bg-primary-900/40 border-none ring-1 ring-white/10 px-4 py-3 text-sm font-black text-white focus:ring-2 focus:ring-accent-500 outline-none transition-all" />
                      <span className="text-primary-400 font-bold">→</span>
                      <input type="time" value={overrideForm.end_time}
                        onChange={e => setOverrideForm(f => ({...f, end_time: e.target.value}))}
                        className="flex-1 rounded-2xl bg-primary-900/40 border-none ring-1 ring-white/10 px-4 py-3 text-sm font-black text-white focus:ring-2 focus:ring-accent-500 outline-none transition-all" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Nota del bloqueo</label>
                    <input type="text" value={overrideForm.note}
                      placeholder="Ej: Congreso médico o Vacaciones"
                      onChange={e => setOverrideForm(f => ({...f, note: e.target.value}))}
                      className="w-full rounded-2xl bg-primary-900/40 border-none ring-1 ring-white/10 px-5 py-4 text-sm font-medium text-white focus:ring-2 focus:ring-accent-500 outline-none transition-all placeholder:text-primary-400/30" />
                  </div>

                  {overrideConflicts.length > 0 && (
                    <div className="p-4 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex gap-4 animate-in shake duration-500">
                      <AlertTriangle className="h-6 w-6 text-accent-500 flex-shrink-0" />
                      <div className="text-xs text-accent-400 font-bold">
                        Hay {overrideConflicts.length} cita(s) este día que serán canceladas automáticamente.
                      </div>
                    </div>
                  )}

                  <button onClick={handleSaveOverride} disabled={internalSaving}
                    className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                      overrideForm.type === 'block' ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-accent-500 hover:bg-accent-400 text-primary-950 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    }`}
                  >
                    {internalSaving ? 'Guardando...' : 'Aplicar Excepción'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
