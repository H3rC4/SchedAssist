"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Save, Coffee, ChevronLeft, ChevronRight, CalendarX, X, Trash2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { dateLocales } from '@/lib/i18n'
import { useLandingTranslation } from '@/components/LanguageContext'

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
  note?: string | null
}

export default function DoctorSchedulePage() {
  const { fullT, language } = useLandingTranslation()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profId, setProfId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [overrides, setOverrides] = useState<Override[]>([])
  
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [overrideModal, setOverrideModal] = useState<{ date: string } | null>(null)
  const [overrideForm, setOverrideForm] = useState({
    type: 'block' as 'block' | 'open',
    start_time: '09:00',
    end_time: '18:00',
    note: ''
  })
  const [overrideConflicts, setOverrideConflicts] = useState<any[]>([])

  const locale = (dateLocales as any)[language]
  const weekDays = language === 'es' 
    ? ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    : language === 'it'
    ? ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: prof } = await supabase
      .from('professionals')
      .select('id, tenant_id')
      .eq('user_id', user.id)
      .single()

    if (prof) {
      setProfId(prof.id)
      setTenantId(prof.tenant_id)
      
      const { data: rulesData } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('professional_id', prof.id)
        .order('day_of_week')
      
      const { data: overridesData } = await supabase
        .from('professional_overrides')
        .select('*')
        .eq('professional_id', prof.id)
        .order('override_date', { ascending: true })

      setRules(rulesData || [])
      setOverrides((overridesData || []) as Override[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateRule = (day: number, field: string, value: any) => {
    setRules(prev => prev.map(r => r.day_of_week === day ? { ...r, [field]: value } : r))
  }

  const toggleLunchBreak = (day: number, active: boolean) => {
    setRules(prev => prev.map(r => r.day_of_week === day ? {
      ...r,
      lunch_break_start: active ? '13:00:00' : null,
      lunch_break_end: active ? '14:00:00' : null
    } : r))
  }

  const handleSaveRules = async () => {
    if (!profId) return
    setSaving(true)
    try {
      await Promise.all(rules.map(rule => 
        supabase.from('availability_rules').upsert({
          ...rule,
          professional_id: profId,
          tenant_id: tenantId
        })
      ))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const checkAffectedAppointments = async (date: string) => {
    if (!profId) return []
    const { data } = await supabase
      .from('appointments')
      .select('id, start_at, clients(first_name, last_name)')
      .eq('professional_id', profId)
      .eq('status', 'scheduled')
      .gte('start_at', `${date}T00:00:00`)
      .lte('start_at', `${date}T23:59:59`)
    return data || []
  }

  const getCalendarDays = (month: Date) => {
    const start = startOfWeek(startOfMonth(month))
    const end = endOfWeek(endOfMonth(month))
    return eachDayOfInterval({ start, end })
  }

  const handleOpenOverrideModal = async (dateStr: string) => {
    const affected = await checkAffectedAppointments(dateStr)
    setOverrideConflicts(affected)
    setOverrideModal({ date: dateStr })
    setOverrideForm({
      type: 'block',
      start_time: '09:00',
      end_time: '18:00',
      note: ''
    })
  }

  const handleSaveOverride = async () => {
    if (!overrideModal || !profId || !tenantId) return
    setSaving(true)
    try {
      if (overrideForm.type === 'block') {
         for (const app of overrideConflicts) {
            await supabase.from('appointments')
              .update({ status: 'cancelled', cancellation_notified: false })
              .eq('id', app.id)
         }
      }

      await supabase.from('professional_overrides').insert({
        professional_id: profId,
        tenant_id: tenantId,
        override_date: overrideModal.date,
        override_type: overrideForm.type,
        start_time: overrideForm.type === 'open' ? overrideForm.start_time + ':00' : null,
        end_time: overrideForm.type === 'open' ? overrideForm.end_time + ':00' : null,
        note: overrideForm.note
      })

      const { data: ov } = await supabase.from('professional_overrides').select('*').eq('professional_id', profId).order('override_date')
      setOverrides((ov || []) as Override[])
      setOverrideModal(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOverride = async (id: string) => {
    await supabase.from('professional_overrides').delete().eq('id', id)
    setOverrides(ov => ov.filter(o => o.id !== id))
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 text-amber-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4 md:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{fullT.nav_schedule}</h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{language === 'es' ? 'Gestión de disponibilidad y ausencias' : 'Manage availability and absences'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Weekly Schedule */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-8">
            <Clock className="h-4 w-4" /> {language === 'es' ? 'CONFIGURACIÓN SEMANAL' : 'WEEKLY CONFIGURATION'}
          </h3>
          <div className="grid gap-4">
            {rules.map(rule => (
              <div key={rule.day_of_week}
                className={`rounded-2xl border transition-all ${rule.active ? 'border-amber-100 bg-white shadow-sm' : 'border-slate-50 bg-slate-50/30 opacity-60'}`}>
                <div className="flex items-center gap-4 p-5">
                  <label className="flex items-center gap-3 cursor-pointer min-w-[140px]">
                    <input type="checkbox" checked={rule.active} onChange={e => updateRule(rule.day_of_week, 'active', e.target.checked)}
                      className="w-5 h-5 rounded-lg border-slate-300 text-amber-600 focus:ring-amber-500" />
                    <span className={`text-sm font-black ${rule.active ? 'text-slate-900' : 'text-slate-400'}`}>{weekDays[rule.day_of_week]}</span>
                  </label>
                  
                  {rule.active && (
                    <div className="flex items-center gap-3 ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                      <input type="time" value={rule.start_time.slice(0, 5)} onChange={e => updateRule(rule.day_of_week, 'start_time', e.target.value + ':00')}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50" />
                      <span className="text-slate-300 font-bold">→</span>
                      <input type="time" value={rule.end_time.slice(0, 5)} onChange={e => updateRule(rule.day_of_week, 'end_time', e.target.value + ':00')}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50" />
                    </div>
                  )}
                </div>

                {rule.active && (
                  <div className="px-5 pb-5 animate-in fade-in duration-300">
                    <div className="flex items-center gap-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl px-5 py-4">
                      <label className="flex items-center gap-2 cursor-pointer text-[10px] text-amber-700 font-black uppercase tracking-widest whitespace-nowrap">
                        <input type="checkbox" checked={!!rule.lunch_break_start} onChange={e => toggleLunchBreak(rule.day_of_week, e.target.checked)}
                          className="w-4 h-4 rounded-md border-amber-300 text-amber-500 focus:ring-amber-400" />
                        <Coffee className="h-4 w-4" /> {language === 'es' ? 'Pausa Almuerzo' : 'Lunch Break'}
                      </label>
                      
                      {rule.lunch_break_start && (
                        <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                          <span className="text-[10px] text-amber-600 font-black">{language === 'es' ? 'DESDE' : 'FROM'}</span>
                          <input type="time" value={rule.lunch_break_start.slice(0, 5)} onChange={e => updateRule(rule.day_of_week, 'lunch_break_start', e.target.value + ':00')}
                            className="rounded-lg border border-amber-200 px-2 py-1.5 text-[11px] font-black focus:ring-2 focus:ring-amber-400 outline-none bg-white w-24" />
                          <span className="text-[10px] text-amber-600 font-black">{language === 'es' ? 'HASTA' : 'UNTIL'}</span>
                          <input type="time" value={(rule.lunch_break_end || '14:00').slice(0, 5)} onChange={e => updateRule(rule.day_of_week, 'lunch_break_end', e.target.value + ':00')}
                            className="rounded-lg border border-amber-200 px-2 py-1.5 text-[11px] font-black focus:ring-2 focus:ring-amber-400 outline-none bg-white w-24" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={handleSaveRules} disabled={saving}
            className="w-full mt-6 flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-900/10 disabled:opacity-50 transition-all active:scale-95">
            {saved ? (<><CheckCircle className="h-6 w-6" /> {language === 'es' ? '¡Horario Guardado!' : 'Schedule Saved!'}</>) : saving ? <Loader2 className="h-6 w-6 animate-spin" /> : (<><Save className="h-6 w-6" /> {fullT.save}</>)}
          </button>
        </div>

        {/* Exceptions Calendar */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <CalendarX className="h-4 w-4" /> {language === 'es' ? 'CALENDARIO DE EXCEPCIONES' : 'EXCEPTIONS CALENDAR'}
               </h3>
              <div className="flex items-center gap-4">
                <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <ChevronLeft className="h-5 w-5 text-slate-400" />
                </button>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest min-w-[140px] text-center">
                  {format(calendarMonth, 'MMMM yyyy', { locale })}
                </h3>
                <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {(language === 'es' ? ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(d => (
                <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase py-2 tracking-widest">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getCalendarDays(calendarMonth).map((day, i) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const isToday = isSameDay(day, new Date())
                const hasOverride = overrides.find(ov => ov.override_date === dateStr)
                const inMonth = isSameMonth(day, calendarMonth)

                return (
                  <button key={i} onClick={() => inMonth && handleOpenOverrideModal(dateStr)} disabled={!inMonth}
                    className={`aspect-square flex flex-col items-center justify-center rounded-[1.2rem] text-[11px] font-black transition-all relative border-2
                      ${!inMonth ? 'opacity-0 cursor-default pointer-events-none' : ''}
                      ${hasOverride?.override_type === 'block' ? 'bg-red-50 border-red-100 text-red-600 shadow-sm' : 
                        hasOverride?.override_type === 'open' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm' :
                        isToday ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'}
                    `}>
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Exceptions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'es' ? 'Próximos días bloqueados' : 'Upcoming blocked days'}</h5>
              <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">{overrides.length} total</span>
            </div>
            {overrides.length === 0 ? (
              <div className="text-center py-12 text-slate-300 italic text-sm bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                {language === 'es' ? 'No tienes excepciones programadas' : 'No scheduled exceptions'}
              </div>
            ) : (
              <div className="grid gap-3">
                {overrides.map(ov => (
                  <div key={ov.id} className="flex items-center justify-between p-5 rounded-3xl border border-slate-100 bg-white shadow-sm group hover:border-amber-100 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${ov.override_type === 'block' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500 shadow-sm'}`}>
                        {ov.override_type === 'block' ? <CalendarX className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{format(parseISO(ov.override_date), "d MMMM", { locale })}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {ov.override_type === 'block' ? (language === 'es' ? 'Bloqueado TOTAL' : 'TOTAL Blocked') : `${ov.start_time?.slice(0, 5)} - ${ov.end_time?.slice(0, 5)}`}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteOverride(ov.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4" onClick={() => setOverrideModal(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {format(parseISO(overrideModal.date), "d MMMM", { locale })}
                </h3>
                <button onClick={() => setOverrideModal(null)} className="p-2 rounded-full hover:bg-slate-50 transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setOverrideForm(f => ({ ...f, type: 'block' }))}
                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      overrideForm.type === 'block' ? 'border-red-400 bg-red-50 text-red-600 shadow-lg shadow-red-500/10' : 'border-slate-50 text-slate-400 hover:border-slate-100'
                    }`}>
                    <CalendarX className="h-4 w-4" /> {language === 'es' ? 'Bloquear' : 'Block'}
                  </button>
                  <button onClick={() => setOverrideForm(f => ({ ...f, type: 'open' }))}
                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      overrideForm.type === 'open' ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/10' : 'border-slate-50 text-slate-400 hover:border-slate-100'
                    }`}>
                    <Clock className="h-4 w-4" /> {language === 'es' ? 'Especial' : 'Special'}
                  </button>
                </div>

                {overrideForm.type === 'open' && (
                  <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <input type="time" value={overrideForm.start_time} onChange={e => setOverrideForm(f => ({...f, start_time: e.target.value}))}
                      className="flex-1 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 py-3 text-sm font-black focus:ring-2 focus:ring-emerald-500 outline-none" />
                    <span className="text-slate-300 font-bold">→</span>
                    <input type="time" value={overrideForm.end_time} onChange={e => setOverrideForm(f => ({...f, end_time: e.target.value}))}
                      className="flex-1 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 py-3 text-sm font-black focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'es' ? 'Nota (Privada)' : 'Note (Private)'}</label>
                  <input type="text" value={overrideForm.note} placeholder={language === 'es' ? 'Ej: Vacaciones o Trámite' : 'e.g. Vacation or Personal'} onChange={e => setOverrideForm(f => ({...f, note: e.target.value}))}
                    className="w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all" />
                </div>

                {overrideConflicts.length > 0 && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-4 animate-in shake duration-500">
                    <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
                    <div className="text-xs text-red-700 font-bold">
                      {language === 'es' 
                        ? `Tienes ${overrideConflicts.length} cita(s) este día que serán canceladas automáticamente.`
                        : `You have ${overrideConflicts.length} appointment(s) this day that will be automatically cancelled.`}
                    </div>
                  </div>
                )}

                <button onClick={handleSaveOverride} disabled={saving}
                  className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                    overrideForm.type === 'block' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                  }`}>
                  {saving ? (language === 'es' ? 'Guardando...' : 'Saving...') : (language === 'es' ? 'Aplicar Excepción' : 'Apply Exception')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
