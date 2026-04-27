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
    onSave(localInfo)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/10 backdrop-blur-3xl p-2 md:p-8 transition-opacity" onClick={onClose}>
      <div 
        className="bg-surface-container-lowest rounded-[2rem] shadow-spatial w-full max-w-5xl h-full md:h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Editoral Header - Asymmetric Split */}
        <div className="flex flex-col md:flex-row border-none bg-surface-container-low px-8 pt-10 pb-8 flex-shrink-0 relative overflow-hidden">
          <div className="flex-1 flex items-center gap-6 z-10">
            <div className="h-20 w-20 rounded-[1.5rem] bg-primary flex items-center justify-center text-on-primary text-2xl font-black shadow-ambient flex-shrink-0">
              {professional.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none mb-2">{professional.full_name}</h3>
              <div className="flex items-center gap-3">
                <span className="bg-secondary-container text-on-secondary-container text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  {professional.specialty || 'General'}
                </span>
                {localInfo.location_id && (
                  <span className="text-sm font-semibold text-on-surface/60">
                    Sede {locations.find(l => l.id === localInfo.location_id)?.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-8 right-8 p-3 rounded-full bg-surface-container-highest hover:bg-surface-container-lowest transition-all shadow-sm z-10 text-on-surface">
            <X className="h-6 w-6" />
          </button>
          
          {/* Subtle Graphic Element */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container/5 blur-[100px] rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
        </div>

        {/* 2:1 Editorial Layout Body */}
        <div className="flex flex-1 min-h-0 flex-col md:flex-row bg-surface-container-lowest">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex flex-col bg-surface p-6 gap-2">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'schedule' ? 'bg-surface-container-highest text-primary shadow-sm' : 'text-on-surface/60 hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <Clock className="h-5 w-5" />
              {T.tab_weekly_config}
            </button>
            <button
              onClick={() => setActiveTab('exceptions')}
              className={`flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'exceptions' ? 'bg-surface-container-highest text-primary shadow-sm' : 'text-on-surface/60 hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarX className="h-5 w-5" />
                {T.tab_exceptions}
              </div>
              {overrides.length > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === 'exceptions' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'}`}>{overrides.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'access' ? 'bg-surface-container-highest text-primary shadow-sm' : 'text-on-surface/60 hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
              {T.tab_access}
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
            
            {/* Access Tab */}
            {activeTab === 'access' && (
              <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h4 className="text-2xl font-black text-on-surface mb-8 tracking-tight">{T.tab_access}</h4>
                
                 {professional.auth_email ? (
                  <div className="bg-surface-container-low rounded-[2rem] p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-16 w-16 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-ambient text-primary">
                        <ShieldCheck className="h-8 w-8" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-on-surface">Portal del Profesional Activo</h4>
                        <p className="text-sm font-medium text-on-surface/60">El acceso está habilitado</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                        <span className="text-[10px] font-black text-on-surface/50 uppercase tracking-widest block mb-2">{T.access_email}</span>
                        <span className="text-lg font-bold text-on-surface break-all">{professional.auth_email}</span>
                      </div>
                      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black text-on-surface/50 uppercase tracking-widest block mb-2">{T.access_pass}</span>
                          <span className="text-lg font-mono font-black text-primary">{localHint ? localHint : T.access_pass_hint}</span>
                        </div>
                        <button 
                          onClick={handleResetPassword} 
                          disabled={resettingPassword} 
                          className="p-4 bg-surface-container-low hover:bg-surface-container-high rounded-2xl text-on-surface transition-all active:scale-95 shadow-sm"
                          title={T.access_reset_btn}
                        >
                          {resettingPassword ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <RefreshCcw className="h-6 w-6" />}
                        </button>
                      </div>
                    </div>
                  </div>
                 ) : (
                  <div className="bg-surface-container-low rounded-[2.5rem] p-12 text-center flex flex-col items-center">
                    <div className="h-24 w-24 bg-surface-container-lowest rounded-3xl flex items-center justify-center mb-6 shadow-ambient">
                      <ShieldCheck className="h-10 w-10 text-on-surface/40" />
                    </div>
                    <h4 className="text-2xl font-black text-on-surface mb-3 tracking-tight">{T.access_no_account}</h4>
                    <p className="text-sm font-medium text-on-surface/60 mb-10 max-w-sm mx-auto leading-relaxed">{T.access_no_account_desc}</p>
                    <button 
                      onClick={handleCreateAccount}
                      disabled={creatingAccount}
                      className="bg-primary flex items-center gap-3 text-on-primary text-sm font-bold px-8 py-5 rounded-full hover:bg-primary-container shadow-ambient transition-all active:scale-95 disabled:opacity-50"
                    >
                      {creatingAccount ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                      <span>{creatingAccount ? 'Procesando...' : T.access_generate_btn}</span>
                    </button>
                  </div>
                 )}
              </div>
            )}

            {/* Exceptions Tab */}
            {activeTab === 'exceptions' && (
              <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-black text-on-surface tracking-tight">{T.tab_exceptions}</h4>
                    <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-2xl">
                      <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="p-2 rounded-xl hover:bg-surface-container-highest text-on-surface transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <span className="text-base font-black text-on-surface capitalize min-w-[140px] text-center">
                        {format(calendarMonth, 'MMMM yyyy', { locale: es })}
                      </span>
                      <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="p-2 rounded-xl hover:bg-surface-container-highest text-on-surface transition-colors">
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface-container-low rounded-[2rem] p-8 shadow-sm">
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-on-surface/50 uppercase tracking-widest">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
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
                            className={`aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-bold transition-all relative
                              ${!inMonth ? 'opacity-0 cursor-default pointer-events-none' : ''}
                              ${hasOverride?.override_type === 'block' ? 'bg-[#ba1a1a] text-white shadow-ambient' : 
                                hasOverride?.override_type === 'open' ? 'bg-secondary-container text-on-secondary-container shadow-ambient' :
                                isToday ? 'bg-surface-container-lowest text-primary ring-2 ring-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-highest'}
                            `}
                          >
                            {format(day, 'd')}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h5 className="text-sm font-black text-on-surface/60 uppercase tracking-widest">Excepciones Programadas</h5>
                    {overrides.length === 0 ? (
                      <div className="text-center py-16 bg-surface-container-low rounded-[2rem] text-on-surface/40 font-medium">No hay excepciones guardadas.</div>
                    ) : (
                      <div className="grid gap-4">
                        {overrides.map(ov => (
                          <div key={ov.id} className="flex items-center justify-between p-6 rounded-[1.5rem] bg-surface-container-low shadow-sm hover:shadow-ambient transition-all group">
                            <div className="flex items-center gap-6">
                              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${ov.override_type === 'block' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-secondary-container text-on-secondary-container'}`}>
                                {ov.override_type === 'block' ? <CalendarX className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                              </div>
                              <div>
                                <p className="text-lg font-black text-on-surface">{format(parseISO(ov.override_date), "d 'de' MMMM", { locale: es })}</p>
                                <p className="text-xs font-bold text-on-surface/60 uppercase tracking-widest mt-1">
                                  {ov.override_type === 'block' ? 'Bloqueado TOTAL' : `${ov.start_time?.slice(0,5)} - ${ov.end_time?.slice(0,5)}`}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => handleDeleteOverride(ov.id)} className="p-4 text-on-surface/40 hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-2xl transition-all shadow-sm">
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h4 className="text-2xl font-black text-on-surface mb-8 tracking-tight">{T.tab_weekly_config}</h4>
                <div className="grid gap-4">
                  {editRules.map((rule) => (
                    <div key={rule.day_of_week}
                      className={`rounded-[1.5rem] p-6 transition-all ${rule.active ? 'bg-surface-container-low shadow-sm' : 'bg-surface opacity-50 grayscale'}`}>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-4 cursor-pointer min-w-[140px]">
                          <input type="checkbox" checked={rule.active}
                            onChange={e => updateRule(rule.day_of_week, 'active', e.target.checked)}
                            className="w-5 h-5 rounded border-none bg-surface-container-highest text-primary focus:ring-primary shadow-sm" />
                          <span className={`text-base font-black ${rule.active ? 'text-on-surface' : 'text-on-surface/60'}`}>
                            {days[rule.day_of_week]}
                          </span>
                        </label>
                        
                        {rule.active && (
                          <div className="flex items-center gap-3 ml-auto">
                            <input type="time" value={rule.start_time.slice(0, 5)}
                              onChange={e => updateRule(rule.day_of_week, 'start_time', e.target.value + ':00')}
                              className="rounded-xl bg-surface-container-lowest border-none px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none text-on-surface shadow-sm" />
                            <span className="text-on-surface/40 font-bold">→</span>
                            <input type="time" value={rule.end_time.slice(0, 5)}
                              onChange={e => updateRule(rule.day_of_week, 'end_time', e.target.value + ':00')}
                              className="rounded-xl bg-surface-container-lowest border-none px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none text-on-surface shadow-sm" />
                          </div>
                        )}
                      </div>

                      {rule.active && (
                        <div className="mt-6 pt-6 border-t border-surface-container-highest flex items-center gap-4">
                          <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-on-surface/60 uppercase tracking-widest">
                            <input
                              type="checkbox"
                              checked={!!rule.lunch_break_start}
                              onChange={e => toggleLunchBreak(rule.day_of_week, e.target.checked)}
                              className="w-4 h-4 rounded border-none bg-surface-container-highest text-secondary focus:ring-secondary shadow-sm"
                            />
                            <Coffee className="h-4 w-4" /> Añadir Pausa
                          </label>
                          
                          {rule.lunch_break_start && (
                             <div className="flex items-center gap-3 ml-auto">
                              <span className="text-[10px] text-on-surface/40 font-black uppercase tracking-widest">De</span>
                              <input type="time" value={rule.lunch_break_start.slice(0, 5)}
                                onChange={e => updateRule(rule.day_of_week, 'lunch_break_start', e.target.value + ':00')}
                                className="rounded-xl bg-surface-container-lowest border-none px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-secondary outline-none text-on-surface shadow-sm w-24" />
                              <span className="text-[10px] text-on-surface/40 font-black uppercase tracking-widest">A</span>
                              <input type="time" value={(rule.lunch_break_end || '14:00').slice(0, 5)}
                                onChange={e => updateRule(rule.day_of_week, 'lunch_break_end', e.target.value + ':00')}
                                className="rounded-xl bg-surface-container-lowest border-none px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-secondary outline-none text-on-surface shadow-sm w-24" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Profile Information Block in Schedule Tab for Editorial Flow */}
                <div className="mt-12 bg-surface-container-low rounded-[2rem] p-8 shadow-sm">
                  <h5 className="text-sm font-black text-on-surface/60 uppercase tracking-widest mb-6">Información de Perfil</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-on-surface/50 uppercase tracking-widest ml-1">Nombre Completo</label>
                      <input 
                        value={localInfo.full_name}
                        onChange={e => setLocalInfo({...localInfo, full_name: e.target.value})}
                        className="w-full rounded-2xl bg-surface-container-lowest border-none px-5 py-4 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-on-surface/50 uppercase tracking-widest ml-1">Especialidad</label>
                      <input 
                        value={localInfo.specialty}
                        onChange={e => setLocalInfo({...localInfo, specialty: e.target.value})}
                        className="w-full rounded-2xl bg-surface-container-lowest border-none px-5 py-4 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                      />
                    </div>
                    {locations.length > 0 && (
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-[10px] font-black text-on-surface/50 uppercase tracking-widest ml-1">Sede Asignada</label>
                        <select
                          value={localInfo.location_id}
                          onChange={e => setLocalInfo({...localInfo, location_id: e.target.value})}
                          className="w-full rounded-2xl bg-surface-container-lowest border-none px-5 py-4 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                        >
                          <option value="">Ninguna / Rotativo</option>
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-8 py-6 bg-surface-container-lowest flex justify-between items-center flex-shrink-0 relative z-20">
          <button 
             onClick={handleConfirmDelete} 
             className="p-4 rounded-2xl bg-surface-container-low text-[#ba1a1a] hover:bg-[#ffdad6] transition-all shadow-sm group flex items-center gap-3"
             title={T.delete}
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-widest hidden sm:block">Eliminar</span>
          </button>
          
          <button 
            onClick={handleSaveAll} 
            disabled={saving} 
            className="flex items-center justify-center gap-3 py-4 px-10 rounded-full bg-primary text-on-primary font-black uppercase tracking-widest hover:bg-primary-container shadow-ambient disabled:opacity-50 transition-all active:scale-95"
          >
            {saved ? (<><CheckCircle className="h-5 w-5" /> <span>{T.saved_success}</span></>) : saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (<><Save className="h-5 w-5" /> <span>{T.save_changes}</span></>)}
          </button>
        </div>

        {/* Glassmorphic Override Modal */}
        {overrideModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/20 backdrop-blur-3xl px-4" onClick={() => setOverrideModal(null)}>
            <div className="bg-surface-container-lowest rounded-[2rem] shadow-spatial w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-on-surface tracking-tight">
                    {format(parseISO(overrideModal.date), "d 'de' MMMM", { locale: es })}
                  </h3>
                  <button onClick={() => setOverrideModal(null)} className="p-2 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors"><X className="h-5 w-5 text-on-surface" /></button>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setOverrideForm(f => ({ ...f, type: 'block' }))}
                      className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        overrideForm.type === 'block' ? 'bg-[#ffdad6] text-[#93000a] shadow-sm' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <CalendarX className="h-6 w-6 mb-1" /> Bloquear
                    </button>
                    <button
                      onClick={() => setOverrideForm(f => ({ ...f, type: 'open' }))}
                      className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        overrideForm.type === 'open' ? 'bg-secondary-container text-on-secondary-container shadow-sm' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <Clock className="h-6 w-6 mb-1" /> Especial
                    </button>
                  </div>

                  {overrideForm.type === 'open' && (
                    <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                      <input type="time" value={overrideForm.start_time}
                        onChange={e => setOverrideForm(f => ({...f, start_time: e.target.value}))}
                        className="flex-1 rounded-xl bg-surface-container-lowest border-none px-4 py-3 text-sm font-black text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm" />
                      <span className="text-on-surface/40 font-bold">→</span>
                      <input type="time" value={overrideForm.end_time}
                        onChange={e => setOverrideForm(f => ({...f, end_time: e.target.value}))}
                        className="flex-1 rounded-xl bg-surface-container-lowest border-none px-4 py-3 text-sm font-black text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-on-surface/50 uppercase tracking-widest ml-1">Nota del bloqueo</label>
                    <input type="text" value={overrideForm.note}
                      placeholder="Ej: Congreso médico o Vacaciones"
                      onChange={e => setOverrideForm(f => ({...f, note: e.target.value}))}
                      className="w-full rounded-2xl bg-surface-container-low border-none px-5 py-4 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-on-surface/30 shadow-sm" />
                  </div>

                  {overrideConflicts.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#ffdad6] flex gap-4 animate-in shake duration-500 shadow-sm">
                      <AlertTriangle className="h-6 w-6 text-[#ba1a1a] flex-shrink-0" />
                      <div className="text-xs text-[#93000a] font-bold">
                        Hay {overrideConflicts.length} cita(s) este día que serán canceladas automáticamente.
                      </div>
                    </div>
                  )}

                  <button onClick={handleSaveOverride} disabled={internalSaving}
                    className={`w-full py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all shadow-ambient active:scale-95 disabled:opacity-50 ${
                      overrideForm.type === 'block' ? 'bg-[#ba1a1a] hover:bg-[#93000a] text-white' : 'bg-primary hover:bg-primary-container text-on-primary'
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
