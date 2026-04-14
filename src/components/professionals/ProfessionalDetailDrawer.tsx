"use client"

import { useState } from 'react'
import { Clock, Save, X, Trash2, Coffee, CalendarX, CheckCircle, RefreshCcw, Loader2 } from 'lucide-react'
import { Professional, AvailabilityRule, Override } from '@/hooks/useProfessionals'

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
        {professional.auth_email && (
          <div className="mx-4 md:mx-8 mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
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
        )}

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
                      className={`rounded-2xl border transition-all ${rule.active ? 'border-primary-100 bg-primary-50/20' : 'border-gray-50 bg-gray-50/30 opacity-60'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-4">
                        <label className="flex items-center gap-3 cursor-pointer min-w-[140px]">
                          <input type="checkbox" checked={rule.active}
                            onChange={e => updateRule(rule.day_of_week, 'active', e.target.checked)}
                            className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className={`text-sm font-bold ${rule.active ? 'text-gray-900' : 'text-gray-400'}`}>
                            {days[rule.day_of_week]}
                          </span>
                        </label>
                        {rule.active && (
                          <div className="flex items-center gap-2 md:gap-3 ml-0 sm:ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                            <input type="time" value={rule.start_time.slice(0, 5)}
                              onChange={e => updateRule(rule.day_of_week, 'start_time', e.target.value + ':00')}
                              className="flex-1 sm:flex-none rounded-xl border border-gray-200 px-3 md:px-4 py-2 text-xs md:text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none" />
                            <span className="text-gray-300 font-bold">→</span>
                            <input type="time" value={rule.end_time.slice(0, 5)}
                              onChange={e => updateRule(rule.day_of_week, 'end_time', e.target.value + ':00')}
                              className="flex-1 sm:flex-none rounded-xl border border-gray-200 px-3 md:px-4 py-2 text-xs md:text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none" />
                          </div>
                        )}
                      </div>

                      {rule.active && (
                        <div className="px-4 pb-4 animate-in fade-in duration-300">
                          <div className="flex flex-col md:flex-row md:items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Coffee className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              <label className="flex items-center gap-2 cursor-pointer text-xs md:text-sm text-amber-700 font-bold whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={!!rule.lunch_break_start}
                                  onChange={e => toggleLunchBreak(rule.day_of_week, e.target.checked)}
                                  className="w-4 h-4 rounded-md border-amber-300 text-amber-500 focus:ring-amber-400"
                                />
                                Pausa comida
                              </label>
                            </div>
                            {rule.lunch_break_start && (
                               <div className="flex items-center gap-2 ml-0 md:ml-auto animate-in fade-in slide-in-from-right-2 duration-300 bg-white/50 p-2 md:p-0 rounded-xl">
                                <span className="text-[10px] text-amber-600 font-bold uppercase">De</span>
                                <input type="time" value={rule.lunch_break_start.slice(0, 5)}
                                  onChange={e => updateRule(rule.day_of_week, 'lunch_break_start', e.target.value + ':00')}
                                  className="flex-1 md:flex-none rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 outline-none bg-white" />
                                <span className="text-[10px] text-amber-600 font-bold uppercase">A</span>
                                <input type="time" value={(rule.lunch_break_end || '14:00').slice(0, 5)}
                                  onChange={e => updateRule(rule.day_of_week, 'lunch_break_end', e.target.value + ':00')}
                                  className="flex-1 md:flex-none rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 outline-none bg-white" />
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
                
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                  <h5 className="text-xs font-black text-amber-700 uppercase mb-4 tracking-wider">Agregar excepción</h5>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                      type="date" 
                      id="new-override-date"
                      className="flex-1 rounded-xl border border-amber-200 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none" 
                    />
                    <select id="new-override-type" className="rounded-xl border border-amber-200 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none">
                      <option value="block">Día Bloqueado (Libre)</option>
                      <option value="open">Horas Especiales (Abierto)</option>
                    </select>
                    <button 
                      onClick={() => {
                        const date = (document.getElementById('new-override-date') as HTMLInputElement).value;
                        const type = (document.getElementById('new-override-type') as HTMLSelectElement).value as 'block' | 'open';
                        if (date) addOverride(date, type);
                      }}
                      className="bg-amber-500 text-white font-black px-6 py-3 rounded-xl hover:bg-amber-600 transition-all text-xs uppercase tracking-widest active:scale-95"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {overrides.length === 0 ? (
                    <div className="text-center py-10 text-gray-300 italic text-sm">No hay excepciones guardadas.</div>
                  ) : (
                    overrides.map(ov => (
                      <div key={ov.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${ov.override_type === 'block' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            {ov.override_type === 'block' ? <CalendarX className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{ov.override_date}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              {ov.override_type === 'block' ? 'Bloqueado' : `${ov.start_time?.slice(0,5)} - ${ov.end_time?.slice(0,5)}`}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteOverride(ov.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
    </div>
  )
}
