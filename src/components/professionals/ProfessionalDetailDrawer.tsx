"use client"

import { useState } from 'react'
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
  addOverride: (date: string, type: 'block' | 'open') => void;
  deleteOverride: (id: string) => void;
  saving: boolean;
  saved: boolean;
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
  saved
}: ProfessionalDetailDrawerProps) {
  const { t } = useLandingTranslation()
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  
  const [localHint, setLocalHint] = useState(professional.auth_password_hint)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [internalSaving, setInternalSaving] = useState(false)
  
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
    const supabase = createClient()
    try {
      if (overrideForm.type === 'block') {
         for (const app of overrideConflicts) {
           await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', app.id)
         }
      }

      // IMPORTANTE: Usamos la prop addOverride para que el estado se sincronice correctamente
      await addOverride(overrideModal.date, overrideForm.type)
      
      setOverrideModal(null)
    } catch (err) {
      console.error(err)
    } finally {
      setInternalSaving(false)
    }
  }

  const handleDeleteOverride = async (id: string) => {
    deleteOverride(id)
  }

  async function handleResetPassword() {
    if (!confirm(t.confirm_reset_pass)) return;
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
      alert(t.success + ': ' + data.new_password)
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
      alert(`${t.success}!\n${t.access_email}: ${data.auth_email}\nPass: ${data.auth_password_hint}`)
      onSave() // Esto refrescará el selectedProf gracias al fix del hook
      setActiveTab('access')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCreatingAccount(false)
    }
  }

  const handleConfirmDelete = () => {
     if (confirm(t.confirm_delete_prof)) {
        onDelete()
     }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-2 md:p-4" onClick={onClose}>
      <div className="bg-white rounded-[2rem] md:rounded-[3xl] shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary-600 flex items-center justify-center text-white text-lg md:text-xl font-bold shadow-lg shadow-primary-200 flex-shrink-0">
              {professional.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <h3 className="text-base md:text-xl font-bold text-gray-900 truncate">{professional.full_name}</h3>
              <p className="text-primary-600 font-semibold text-xs md:text-sm truncate">{professional.specialty || 'General'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 flex-shrink-0 ml-2">
            <X className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 md:px-8 bg-white z-20 sticky top-0">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-6 py-4 text-xs md:text-sm font-black border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'schedule' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-500'
            }`}
          >
            {t.tab_weekly_config}
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`flex items-center gap-2 px-6 py-4 text-xs md:text-sm font-black border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'exceptions' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-500'
            }`}
          >
            {t.tab_exceptions}
            {overrides.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">{overrides.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`flex items-center gap-2 px-6 py-4 text-xs md:text-sm font-black border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'access' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-500'
            }`}
          >
            {t.tab_access}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
          
          {activeTab === 'access' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
               {professional.auth_email ? (
                <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-900/10 border border-slate-800">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-slate-900" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">{t.access_title}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Portal del Profesional Activo</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5 group hover:border-white/10 transition-colors">
                      <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">{t.access_email}</span>
                      <span className="text-sm font-bold text-white break-all">{professional.auth_email}</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">{t.access_pass}</span>
                        <span className="text-sm font-mono font-bold text-amber-400">{localHint ? localHint : t.access_pass_hint}</span>
                      </div>
                      <button 
                        onClick={handleResetPassword} 
                        disabled={resettingPassword} 
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-amber-500 transition-all hover:scale-110 active:scale-95 border border-white/5"
                        title={t.access_reset_btn}
                      >
                        {resettingPassword ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCcw className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
               ) : (
                <div className="bg-gradient-to-br from-indigo-50 to-white border-2 border-dashed border-indigo-100 rounded-[3rem] p-12 text-center group">
                  <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100/50 group-hover:scale-110 transition-transform duration-500">
                    <ShieldCheck className="h-10 w-10 text-indigo-400" />
                  </div>
                  <h4 className="text-lg font-black text-indigo-900 mb-2">{t.access_no_account}</h4>
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-8 max-w-xs mx-auto">{t.access_no_account_desc}</p>
                  <button 
                    onClick={handleCreateAccount}
                    disabled={creatingAccount}
                    className="bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] px-10 py-5 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {creatingAccount ? <Loader2 className="h-5 w-5 animate-spin mx-auto text-white" /> : t.access_generate_btn}
                  </button>
                </div>
               )}
            </div>
          )}

          {activeTab === 'exceptions' && (
            <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <CalendarX className="h-4 w-4" /> {t.tab_exceptions}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-black text-gray-700 capitalize min-w-[120px] text-center">
                          {format(calendarMonth, 'MMMM yyyy', { locale: es })}
                        </span>
                        <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                          <ChevronRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-gray-300 uppercase py-2">{d}</div>
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
                              ${hasOverride?.override_type === 'block' ? 'bg-red-50 border-red-100 text-red-600 shadow-sm' : 
                                hasOverride?.override_type === 'open' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm' :
                                isToday ? 'bg-primary-50 border-primary-100 text-primary-700' : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'}
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
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Excepciones Activas</h5>
                    <span className="text-[10px] font-black text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">{overrides.length} total</span>
                  </div>
                  {overrides.length === 0 ? (
                    <div className="text-center py-12 text-gray-300 italic text-sm border-2 border-dashed border-gray-100 rounded-3xl">No hay excepciones guardadas.</div>
                  ) : (
                    <div className="grid gap-3">
                      {overrides.map(ov => (
                        <div key={ov.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-amber-200 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${ov.override_type === 'block' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500 shadow-sm'}`}>
                              {ov.override_type === 'block' ? <CalendarX className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900">{format(parseISO(ov.override_date), "d 'de' MMMM", { locale: es })}</p>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {ov.override_type === 'block' ? 'Bloqueado TOTAL' : `${ov.start_time?.slice(0,5)} - ${ov.end_time?.slice(0,5)}`}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteOverride(ov.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
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
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {t.tab_weekly_config}
                </h4>
                <div className="grid gap-3 md:gap-4">
                  {editRules.map((rule) => (
                    <div key={rule.day_of_week}
                      className={`rounded-2xl border transition-all ${rule.active ? 'border-primary-100 bg-white shadow-sm' : 'border-gray-100 bg-gray-50/30 opacity-60'}`}>
                      <div className="flex items-center gap-4 p-4">
                        <label className="flex items-center gap-3 cursor-pointer min-w-[120px]">
                          <input type="checkbox" checked={rule.active}
                            onChange={e => updateRule(rule.day_of_week, 'active', e.target.checked)}
                            className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className={`text-sm font-bold ${rule.active ? 'text-gray-900' : 'text-gray-400'}`}>
                            {days[rule.day_of_week]}
                          </span>
                        </label>
                        
                        {rule.active && (
                          <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                            <input type="time" value={rule.start_time.slice(0, 5)}
                              onChange={e => updateRule(rule.day_of_week, 'start_time', e.target.value + ':00')}
                              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50" />
                            <span className="text-gray-300 font-bold">→</span>
                            <input type="time" value={rule.end_time.slice(0, 5)}
                              onChange={e => updateRule(rule.day_of_week, 'end_time', e.target.value + ':00')}
                              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50" />
                          </div>
                        )}
                      </div>

                      {rule.active && (
                        <div className="px-4 pb-4 animate-in fade-in duration-300">
                          <div className="flex items-center gap-4 bg-amber-50/50 border border-amber-100/50 rounded-xl px-4 py-3">
                            <label className="flex items-center gap-2 cursor-pointer text-[10px] text-amber-700 font-black uppercase tracking-widest whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={!!rule.lunch_break_start}
                                onChange={e => toggleLunchBreak(rule.day_of_week, e.target.checked)}
                                className="w-4 h-4 rounded-md border-amber-300 text-amber-500 focus:ring-amber-400"
                              />
                              <Coffee className="h-3.5 w-3.5" /> Pausa
                            </label>
                            
                            {rule.lunch_break_start && (
                               <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                                <span className="text-[10px] text-amber-600 font-black uppercase">De</span>
                                <input type="time" value={rule.lunch_break_start.slice(0, 5)}
                                  onChange={e => updateRule(rule.day_of_week, 'lunch_break_start', e.target.value + ':00')}
                                  className="rounded-lg border border-amber-200 px-2 py-1.5 text-[11px] font-bold focus:ring-2 focus:ring-amber-400 outline-none bg-white w-20" />
                                <span className="text-[10px] text-amber-600 font-black uppercase">A</span>
                                <input type="time" value={(rule.lunch_break_end || '14:00').slice(0, 5)}
                                  onChange={e => updateRule(rule.day_of_week, 'lunch_break_end', e.target.value + ':00')}
                                  className="rounded-lg border border-amber-200 px-2 py-1.5 text-[11px] font-bold focus:ring-2 focus:ring-amber-400 outline-none bg-white w-20" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información de Perfil</p>
                      <p className="text-xl font-black text-slate-900">{professional.specialty || 'General'}</p>
                    </div>
                  </div>
                </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-6 border-t border-gray-100 flex gap-4 md:gap-6 flex-shrink-0 bg-white">
          <button onClick={handleConfirmDelete} className="p-4 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition-all active:scale-95 shadow-sm">
            <Trash2 className="h-6 w-6" />
          </button>
          <button onClick={onSave} disabled={saving} className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-900/10 disabled:opacity-50 transition-all active:scale-95">
            {saved ? (<><CheckCircle className="h-6 w-6" /> {t.saved_success}</>) : saving ? <Loader2 className="h-6 w-6 animate-spin" /> : (<><Save className="h-6 w-6" /> {t.save_changes}</>)}
          </button>
        </div>

        {/* Override Modal */}
        {overrideModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4" onClick={() => setOverrideModal(null)}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {format(parseISO(overrideModal.date), "d 'de' MMMM", { locale: es })}
                  </h3>
                  <button onClick={() => setOverrideModal(null)} className="p-2 rounded-full hover:bg-slate-50 transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOverrideForm(f => ({ ...f, type: 'block' }))}
                      className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        overrideForm.type === 'block' ? 'border-red-400 bg-red-50 text-red-600 shadow-lg shadow-red-500/10' : 'border-slate-50 text-slate-400 hover:border-slate-100'
                      }`}
                    >
                      <CalendarX className="h-4 w-4" /> Bloquear
                    </button>
                    <button
                      onClick={() => setOverrideForm(f => ({ ...f, type: 'open' }))}
                      className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        overrideForm.type === 'open' ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/10' : 'border-slate-50 text-slate-400 hover:border-slate-100'
                      }`}
                    >
                      <Clock className="h-4 w-4" /> Especial
                    </button>
                  </div>

                  {overrideForm.type === 'open' && (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <input type="time" value={overrideForm.start_time}
                        onChange={e => setOverrideForm(f => ({...f, start_time: e.target.value}))}
                        className="flex-1 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 py-3 text-sm font-black focus:ring-2 focus:ring-emerald-500 outline-none" />
                      <span className="text-slate-300 font-bold">→</span>
                      <input type="time" value={overrideForm.end_time}
                        onChange={e => setOverrideForm(f => ({...f, end_time: e.target.value}))}
                        className="flex-1 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 py-3 text-sm font-black focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nota del bloqueo</label>
                    <input type="text" value={overrideForm.note}
                      placeholder="Ej: Congreso médico o Vacaciones"
                      onChange={e => setOverrideForm(f => ({...f, note: e.target.value}))}
                      className="w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                  </div>

                  {overrideConflicts.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4 animate-in shake duration-500">
                      <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />
                      <div className="text-xs text-amber-700 font-bold">
                        Hay {overrideConflicts.length} cita(s) este día que serán canceladas automáticamente.
                      </div>
                    </div>
                  )}

                  <button onClick={handleSaveOverride} disabled={internalSaving}
                    className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                      overrideForm.type === 'block' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
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
