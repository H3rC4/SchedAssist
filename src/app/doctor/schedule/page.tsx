"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Save, Coffee, ChevronLeft, ChevronRight, CalendarX, X, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

interface AvailabilityRule {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
  lunch_break_start?: string | null
  lunch_break_end?: string | null
}

interface Override {
  id: string
  override_date: string
  override_type: 'block' | 'open'
  start_time: string | null
  end_time: string | null
}

interface AffectedAppointment {
  id: string
  start_at: string
  clients: { first_name: string; last_name: string } | null
}

export default function DoctorSchedulePage() {
  const supabase = createClient()
  const [profId, setProfId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [overrides, setOverrides] = useState<Override[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Calendar state for overrides
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedType, setSelectedType] = useState<'block' | 'open'>('block')

  // Warning modal state
  const [affectedApps, setAffectedApps] = useState<AffectedAppointment[]>([])
  const [showWarning, setShowWarning] = useState(false)
  const [pendingOverride, setPendingOverride] = useState<{ date: string; type: 'block' | 'open' } | null>(null)

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: tu } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single()
      const { data: prof } = await supabase.from('professionals').select('id, availability_rules(*)').eq('user_id', user.id).single()

      if (tu && prof) {
        setProfId(prof.id)
        setTenantId(tu.tenant_id)

        // Ensure all 7 days exist
        const existingRules = (prof.availability_rules || []) as AvailabilityRule[]
        const fullRules: AvailabilityRule[] = []
        for (let i = 0; i < 7; i++) {
          const existing = existingRules.find(r => r.day_of_week === i)
          fullRules.push(existing || { day_of_week: i, start_time: '09:00:00', end_time: '18:00:00', active: i > 0 && i < 6 })
        }
        setRules(fullRules.sort((a, b) => a.day_of_week - b.day_of_week))

        // Fetch overrides
        const { data: ov } = await supabase.from('professional_overrides').select('*').eq('professional_id', prof.id).order('override_date')
        setOverrides((ov || []) as Override[])
      }
      setLoading(false)
    }
    init()
  }, [])

  const updateRule = (day: number, field: string, value: any) => {
    setRules(r => r.map(rule => rule.day_of_week === day ? { ...rule, [field]: value } : rule))
  }

  const toggleLunchBreak = (day: number, active: boolean) => {
    setRules(r => r.map(rule => rule.day_of_week === day ? { ...rule, lunch_break_start: active ? '13:00:00' : null, lunch_break_end: active ? '14:00:00' : null } : rule))
  }

  const handleSaveRules = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/professionals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professional_id: profId, tenant_id: tenantId, rules })
      })
      if (res.ok) setSaved(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const checkAffectedAppointments = async (date: string) => {
    const { data } = await supabase
      .from('appointments')
      .select('id, start_at, clients(first_name, last_name)')
      .eq('professional_id', profId)
      .gte('start_at', date)
      .lte('start_at', date + 'T23:59:59')
      .neq('status', 'cancelled')

    return (data || []) as unknown as AffectedAppointment[]
  }

  const handleAddOverride = async (date: string, type: 'block' | 'open') => {
    if (type === 'block') {
      const affected = await checkAffectedAppointments(date)
      if (affected.length > 0) {
        setAffectedApps(affected)
        setPendingOverride({ date, type })
        setShowWarning(true)
        return
      }
    }
    await confirmAddOverride(date, type)
  }

  const confirmAddOverride = async (date: string, type: 'block' | 'open') => {
    const { error } = await supabase.from('professional_overrides').insert({
      professional_id: profId,
      tenant_id: tenantId,
      override_date: date,
      override_type: type,
      start_time: type === 'open' ? '09:00:00' : null,
      end_time: type === 'open' ? '18:00:00' : null
    })
    if (!error) {
      const { data: ov } = await supabase.from('professional_overrides').select('*').eq('professional_id', profId).order('override_date')
      setOverrides((ov || []) as Override[])
    }
    setSelectedDate('')
    setShowWarning(false)
    setPendingOverride(null)
  }

  const handleForceBlock = async () => {
    if (!pendingOverride) return
    // Cancel affected appointments
    for (const app of affectedApps) {
      await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', app.id)
    }
    await confirmAddOverride(pendingOverride.date, pendingOverride.type)
  }

  const deleteOverride = async (id: string) => {
    await supabase.from('professional_overrides').delete().eq('id', id)
    setOverrides(ov => ov.filter(o => o.id !== id))
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mi Horario</h1>
        <p className="text-sm font-medium text-slate-400 mt-1">Configura tus días y horas de trabajo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Schedule */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Clock className="h-4 w-4" /> Horario Semanal
          </h3>
          <div className="grid gap-4">
            {rules.map(rule => (
              <div key={rule.day_of_week}
                className={`rounded-2xl border transition-all ${rule.active ? 'border-amber-100 bg-white shadow-sm' : 'border-slate-100 bg-slate-50/30 opacity-60'}`}>
                <div className="flex items-center gap-4 p-4">
                  <label className="flex items-center gap-3 cursor-pointer min-w-[120px]">
                    <input type="checkbox" checked={rule.active} onChange={e => updateRule(rule.day_of_week, 'active', e.target.checked)}
                      className="w-5 h-5 rounded-lg border-slate-300 text-amber-500 focus:ring-amber-500" />
                    <span className={`text-sm font-bold ${rule.active ? 'text-slate-900' : 'text-slate-400'}`}>{days[rule.day_of_week]}</span>
                  </label>
                  
                  {rule.active && (
                    <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                      <input type="time" value={rule.start_time.slice(0, 5)} onChange={e => updateRule(rule.day_of_week, 'start_time', e.target.value + ':00')}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50" />
                      <span className="text-slate-300 font-bold">→</span>
                      <input type="time" value={rule.end_time.slice(0, 5)} onChange={e => updateRule(rule.day_of_week, 'end_time', e.target.value + ':00')}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50" />
                    </div>
                  )}
                </div>

                {rule.active && (
                  <div className="px-4 pb-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-4 bg-amber-50/50 border border-amber-100/50 rounded-xl px-4 py-3">
                      <label className="flex items-center gap-2 cursor-pointer text-[10px] text-amber-700 font-black uppercase tracking-widest whitespace-nowrap">
                        <input type="checkbox" checked={!!rule.lunch_break_start} onChange={e => toggleLunchBreak(rule.day_of_week, e.target.checked)}
                          className="w-4 h-4 rounded-md border-amber-300 text-amber-500 focus:ring-amber-400" />
                        <Coffee className="h-3.5 w-3.5" /> Pausa
                      </label>
                      
                      {rule.lunch_break_start && (
                        <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                          <span className="text-[10px] text-amber-600 font-black uppercase">De</span>
                          <input type="time" value={rule.lunch_break_start.slice(0, 5)} onChange={e => updateRule(rule.day_of_week, 'lunch_break_start', e.target.value + ':00')}
                            className="rounded-lg border border-amber-200 px-2 py-1.5 text-[11px] font-bold focus:ring-2 focus:ring-amber-400 outline-none bg-white w-20" />
                          <span className="text-[10px] text-amber-600 font-black uppercase">A</span>
                          <input type="time" value={(rule.lunch_break_end || '14:00').slice(0, 5)} onChange={e => updateRule(rule.day_of_week, 'lunch_break_end', e.target.value + ':00')}
                            className="rounded-lg border border-amber-200 px-2 py-1.5 text-[11px] font-bold focus:ring-2 focus:ring-amber-400 outline-none bg-white w-20" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={handleSaveRules} disabled={saving}
            className="w-full mt-6 flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-amber-500 hover:text-slate-900 shadow-xl disabled:opacity-50 transition-all text-sm">
            {saved ? (<><CheckCircle className="h-5 w-5" /> ¡Guardado!</>) : saving ? 'Guardando...' : (<><Save className="h-5 w-5" /> Guardar Horario</>)}
          </button>
        </div>

        {/* Exceptions Calendar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <ChevronLeft className="h-4 w-4 text-slate-500" />
              </button>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                {format(viewDate, 'MMMM yyyy', { locale: es })}
              </h3>
              <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-7 gap-1 mb-3">
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {eachDayOfInterval({ start: startOfWeek(startOfMonth(viewDate)), end: endOfWeek(endOfMonth(viewDate)) }).map((date, i) => {
                  const dateStr = format(date, 'yyyy-MM-dd')
                  const isToday = isSameDay(date, new Date())
                  const isSelected = selectedDate === dateStr
                  const hasOverride = overrides.find(ov => ov.override_date === dateStr)
                  const inMonth = isSameMonth(date, viewDate)

                  return (
                    <button key={i} onClick={() => inMonth && setSelectedDate(dateStr)} disabled={!inMonth}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all relative
                        ${!inMonth ? 'opacity-0 cursor-default' : 'hover:bg-amber-50'}
                        ${isSelected ? 'bg-amber-500 text-white shadow-lg' : isToday ? 'text-amber-600 bg-amber-50' : 'text-slate-600'}`}>
                      {format(date, 'd')}
                      {hasOverride && !isSelected && (
                        <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${hasOverride.override_type === 'block' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="p-6 bg-amber-50 border-t border-amber-100 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Añadir para: <span className="text-amber-800">{selectedDate}</span></p>
                  <button onClick={() => setSelectedDate('')} className="text-amber-600 border border-amber-200 rounded-lg p-1 hover:bg-white transition-all"><X className="h-3 w-3" /></button>
                </div>
                <div className="flex gap-3">
                  <select value={selectedType} onChange={e => setSelectedType(e.target.value as 'block' | 'open')}
                    className="flex-1 rounded-xl border border-amber-200 px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none bg-white">
                    <option value="block">Día Bloqueado (Libre)</option>
                    <option value="open">Horas Especiales</option>
                  </select>
                  <button onClick={() => handleAddOverride(selectedDate, selectedType)}
                    className="bg-amber-500 text-white font-black px-6 py-2.5 rounded-xl hover:bg-amber-600 transition-all text-[10px] uppercase tracking-widest active:scale-95">
                    Añadir
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Override List */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Excepciones activas</h5>
            {overrides.length === 0 ? (
              <div className="text-center py-8 text-slate-300 italic text-sm bg-white rounded-2xl border border-slate-200">Sin excepciones</div>
            ) : (
              overrides.map(ov => (
                <div key={ov.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white shadow-sm group hover:border-amber-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${ov.override_type === 'block' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      {ov.override_type === 'block' ? <CalendarX className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{ov.override_date}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {ov.override_type === 'block' ? 'Bloqueado' : `${ov.start_time?.slice(0, 5)} - ${ov.end_time?.slice(0, 5)}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => deleteOverride(ov.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Warning Modal: Affected Appointments */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm" onClick={() => { setShowWarning(false); setPendingOverride(null) }}>
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
                {affectedApps.map(app => (
                  <div key={app.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-red-100">
                    <span className="text-sm font-bold text-slate-900">
                      {app.clients?.first_name} {app.clients?.last_name}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {format(parseISO(app.start_at), 'HH:mm')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setShowWarning(false); setPendingOverride(null) }}
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
