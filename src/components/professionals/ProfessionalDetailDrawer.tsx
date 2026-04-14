"use client"

import { useState } from 'react'
import { Clock, Save, X, Trash2, Coffee, CalendarX, CheckCircle, RefreshCcw, Loader2, ChevronLeft, ChevronRight as ChevronRightIcon, AlertTriangle } from 'lucide-react'
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

interface ProfessionalDetailDrawerProps {
  professional: Professional;
  onClose: () => void;
  activeTab: 'schedule' | 'exceptions';
  setActiveTab: (tab: 'schedule' | 'exceptions') => void;
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
  
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  
  const [localHint, setLocalHint] = useState(professional.auth_password_hint)
  const [resettingPassword, setResettingPassword] = useState(false)
  
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedType, setSelectedType] = useState<'block' | 'open'>('block')

  // Warning state for affected appointments
  const [showWarning, setShowWarning] = useState(false)
  const [affectedApps, setAffectedApps] = useState<any[]>([])
  const [pendingBlock, setPendingBlock] = useState('')

  const handleAddOverride = async (date: string, type: 'block' | 'open') => {
    if (type === 'block') {
      const supabase = createClient()
      const { data } = await supabase
        .from('appointments')
        .select('id, start_at, clients(first_name, last_name)')
        .eq('professional_id', professional.id)
        .gte('start_at', date)
        .lte('start_at', date + 'T23:59:59')
        .neq('status', 'cancelled')
      if (data && data.length > 0) {
        setAffectedApps(data)
        setPendingBlock(date)
        setShowWarning(true)
        return
      }
    }
    addOverride(date, type)
    setSelectedDate('')
  }

  const handleForceBlock = async () => {
    const supabase = createClient()
    for (const app of affectedApps) {
      await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', app.id)
    }
    addOverride(pendingBlock, 'block')
    setShowWarning(false)
    setPendingBlock('')
    setAffectedApps([])
    setSelectedDate('')
  }

  async function handleResetPassword() {
    if (!confirm('¿Seguro que deseas restablecer la contraseña temporal? El profesional deberá cambiarla al iniciar sesión.')) return;
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
      alert('Contraseña restablecida: ' + data.new_password)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setResettingPassword(false)
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
        <div className="flex border-b border-gray-100 px-4 md:px-8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'schedule' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Clock className="h-4 w-4" /> Horarios
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'exceptions' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <CalendarX className="h-4 w-4" /> Excepciones
            {overrides.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">{overrides.length}</span>
            )}
          </button>
        </div>

        {/* Credentials Info Box */}
        <div className="mx-4 md:mx-8 mt-6">
          {professional.auth_email ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuario / Email</h4>
                <p className="text-sm font-bold text-slate-700 break-all">{professional.auth_email}</p>
              </div>
              <div className="flex-1 flex flex-col items-start gap-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contraseña Temporal</h4>
                <div className="flex items-center gap-3">
                  <div className="inline-block bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-mono font-bold text-slate-700 tracking-wide">{localHint ? localHint : 'Ya cambiada'}</span>
                  </div>
                  <button 
                    onClick={handleResetPassword}
                    disabled={resettingPassword}
                    className="flex flex-col items-center justify-center p-1.5 text-xs text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-200/50 transition-colors disabled:opacity-50"
                    title="Restablecer contraseña a este profesional"
                  >
                    {resettingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/50 border border-dashed border-amber-200 rounded-xl p-6 text-center">
               <p className="text-xs font-bold text-amber-700/60 uppercase tracking-widest mb-1">Sin Acceso al Portal</p>
               <p className="text-sm text-amber-800/40 font-medium">Este profesional no tiene credenciales de acceso creadas.</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
          {activeTab === 'schedule' ? (
            <div className="space-y-6">
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-4 w-4" /> CONFIGURACIÓN SEMANAL
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
            ) : (
            <div className="space-y-6">
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <CalendarX className="h-4 w-4" /> DÍAS LIBRES Y EXCEPCIONES
                </h4>
                
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                    <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors">
                      <ChevronLeft className="h-4 w-4 text-slate-500" />
                    </button>
                    <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                      {format(viewDate, 'MMMM yyyy', { locale: es })}
                    </h5>
                    <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors">
                      <ChevronRightIcon className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {eachDayOfInterval({
                        start: startOfWeek(startOfMonth(viewDate)),
                        end: endOfWeek(endOfMonth(viewDate))
                      }).map((date, i) => {
                        const dateStr = format(date, 'yyyy-MM-dd')
                        const isToday = isSameDay(date, new Date())
                        const isSelected = selectedDate === dateStr
                        const hasOverride = overrides.find(ov => ov.override_date === dateStr)
                        const inMonth = isSameMonth(date, viewDate)

                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedDate(dateStr)}
                            disabled={!inMonth}
                            className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all relative
                              ${!inMonth ? 'opacity-0 cursor-default' : 'hover:bg-amber-50 dark:hover:bg-amber-900/20'}
                              ${isSelected ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : isToday ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400'}
                            `}
                          >
                            {format(date, 'd')}
                            {hasOverride && !isSelected && (
                              <div className={`absolute bottom-1 w-1 h-1 rounded-full ${hasOverride.override_type === 'block' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Selection Actions */}
                  {selectedDate && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border-t border-amber-100 dark:border-amber-500/10 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Añadir para: <span className="text-amber-800 dark:text-amber-400">{selectedDate}</span></p>
                        <button onClick={() => setSelectedDate('')} className="text-amber-600 border border-amber-200 rounded-lg p-1 hover:bg-white transition-all"><X className="h-3 w-3" /></button>
                      </div>
                      <div className="flex gap-3">
                        <select 
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value as 'block' | 'open')}
                          className="flex-1 rounded-xl border border-amber-200 dark:border-amber-500/20 px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none bg-white dark:bg-slate-950"
                        >
                          <option value="block">Día Bloqueado (Libre)</option>
                          <option value="open">Horas Especiales (Abierto)</option>
                        </select>
                        <button 
                          onClick={() => handleAddOverride(selectedDate, selectedType)}
                          className="bg-amber-500 text-white font-black px-6 py-2.5 rounded-xl hover:bg-amber-600 transition-all text-[10px] uppercase tracking-widest active:scale-95 shadow-md shadow-amber-500/10"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Próximas excepciones</h5>
                  {overrides.length === 0 ? (
                    <div className="text-center py-10 text-gray-300 italic text-sm">No hay excepciones guardadas.</div>
                  ) : (
                    overrides.map(ov => (
                      <div key={ov.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:border-amber-100 dark:hover:border-amber-500/20 group">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rotate-3 group-hover:rotate-0 rounded-xl flex items-center justify-center transition-all ${ov.override_type === 'block' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'}`}>
                            {ov.override_type === 'block' ? <CalendarX className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{ov.override_date}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              {ov.override_type === 'block' ? 'Bloqueado' : `${ov.start_time?.slice(0,5)} - ${ov.end_time?.slice(0,5)}`}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteOverride(ov.id)}
                          className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 md:px-8 pb-6 md:pb-8 pt-4 flex gap-3 md:gap-4 flex-shrink-0 bg-white">
          <button 
            onClick={onDelete}
            className="flex items-center justify-center p-4 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-xl shadow-primary-200 disabled:opacity-50 transition-all text-sm md:text-base">
            {saved ? (
              <><CheckCircle className="h-5 w-5" /> ¡Guardado!</>
            ) : saving ? 'Guardando...' : (
              <><Save className="h-5 w-5" /> Confirmar Cambios</>
            )}
          </button>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm" onClick={() => { setShowWarning(false); setPendingBlock('') }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="h-2 bg-gradient-to-r from-red-400 to-orange-500" />
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">¡Atención!</h3>
                  <p className="text-xs text-slate-400 font-medium">Este día tiene citas programadas</p>
                </div>
              </div>
              <div className="bg-red-50 rounded-2xl p-4 mb-6 space-y-2">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3">
                  {affectedApps.length} cita{affectedApps.length !== 1 ? 's' : ''} afectada{affectedApps.length !== 1 ? 's' : ''}:
                </p>
                {affectedApps.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-red-100">
                    <span className="text-sm font-bold text-slate-900">{app.clients?.first_name} {app.clients?.last_name}</span>
                    <span className="text-xs font-bold text-slate-400">{format(parseISO(app.start_at), 'HH:mm')}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowWarning(false); setPendingBlock('') }}
                  className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all">
                  Cancelar
                </button>
                <button onClick={handleForceBlock}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white text-sm font-black hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all">
                  Bloquear y Cancelar Citas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
