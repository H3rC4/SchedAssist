"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Phone, Stethoscope, Plus, MessageSquare, CheckCircle } from 'lucide-react'
import { format, parseISO, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns'
import { translations, dateLocales, getTranslations } from '@/lib/i18n'
import { useLandingTranslation } from '@/components/LanguageContext'
import { QuickAppointmentDrawer } from '@/components/appointments/QuickAppointmentDrawer'

interface Appointment {
  id: string
  status: string
  start_at: string
  cancellation_notified: boolean
  clients: { first_name: string; last_name: string; phone: string } | null
  services: { name: string } | null
}

export default function DoctorDashboard() {
  const { fullT, language } = useLandingTranslation()
  const supabase = createClient()
  const [profId, setProfId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [allMonthApps, setAllMonthApps] = useState<Appointment[]>([])
  const [pendingCalls, setPendingCalls] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [notifyingId, setNotifyingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [callNotes, setCallNotes] = useState<{[key: string]: string}>({})
  
  // New appointment states
  const [showNewModal, setShowNewModal] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotLoading, setSlotLoading] = useState(false)

  const fetchAppointments = useCallback(async (pId: string, tId: string, month: Date) => {
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end = format(endOfMonth(month), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('appointments')
      .select('id, status, start_at, clients(first_name, last_name, phone), services(name)')
      .eq('professional_id', pId)
      .eq('tenant_id', tId)
      .gte('start_at', start)
      .lte('start_at', end + 'T23:59:59')
      .order('start_at')

    if (data) {
      setAllMonthApps(data as any)
      const pending = (data as any).filter((a: any) => a.status === 'cancelled' && !a.cancellation_notified)
      setPendingCalls(pending)
    }
  }, [supabase])

  const fetchMeta = useCallback(async (tId: string) => {
    const { data: s } = await supabase.from('services').select('id, name').eq('tenant_id', tId).eq('active', true)
    const { data: p } = await supabase.from('professionals').select('id, full_name').eq('tenant_id', tId).eq('active', true)
    if (s) setServices(s)
    if (p) setProfessionals(p)
  }, [supabase])

  const fetchSlots = useCallback(async (pId: string, dateStr: string) => {
    if (!pId || !tenantId || !dateStr) return
    setSlotLoading(true)
    const date = parseISO(dateStr)
    const dayOfWeek = date.getDay()

    // 0. Check for overrides
    const { data: override } = await supabase
      .from('professional_availability_overrides')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('professional_id', pId)
      .eq('override_date', dateStr)
      .maybeSingle()

    if (override?.override_type === 'block') {
      setAvailableSlots([])
      setSlotLoading(false)
      return
    }

    let effectiveRules: any[] = []
    if (override?.override_type === 'open') {
      effectiveRules = [{ 
        start_time: override.start_time, 
        end_time: override.end_time,
        lunch_break_start: null,
        lunch_break_end: null
      }]
    } else {
      const { data: rules } = await supabase.from('availability_rules').select('*')
        .eq('tenant_id', tenantId).eq('professional_id', pId)
        .eq('day_of_week', dayOfWeek).eq('active', true)

      if (!rules || rules.length === 0) { 
        setAvailableSlots([])
        setSlotLoading(false)
        return 
      }
      effectiveRules = rules
    }

    const { data: existingApps } = await supabase.from('appointments').select('start_at, end_at')
      .eq('tenant_id', tenantId).eq('professional_id', pId).neq('status', 'cancelled')
      .gte('start_at', `${dateStr}T00:00:00Z`).lte('start_at', `${dateStr}T23:59:59Z`)

    const slots: string[] = []
    const now = new Date()

    for (const rule of effectiveRules) {
      let current = parseISO(`${dateStr}T${rule.start_time}`)
      const endRule = parseISO(`${dateStr}T${rule.end_time}`)
      const lunchStart = rule.lunch_break_start ? parseISO(`${dateStr}T${rule.lunch_break_start}`) : null
      const lunchEnd = rule.lunch_break_end ? parseISO(`${dateStr}T${rule.lunch_break_end}`) : null

      while (current < endRule) {
        const slotStart = new Date(current)
        const slotEnd = new Date(current.getTime() + 30 * 60000)
        
        if (slotEnd > endRule) break

        if (slotStart >= now) {
          // Lunch break check
          if (lunchStart && lunchEnd && slotStart < lunchEnd && slotEnd > lunchStart) {
            current = slotEnd
            continue
          }

          const isOccupied = existingApps?.some((a: any) => {
            const appStart = parseISO(a.start_at.slice(0, 19))
            const appEnd = parseISO(a.end_at.slice(0, 19))
            return appStart < slotEnd && appEnd > slotStart
          })
          if (!isOccupied) slots.push(format(slotStart, 'HH:mm'))
        }
        current = slotEnd
      }
    }
    setAvailableSlots(slots)
    setSlotLoading(false)
  }, [supabase, tenantId])

  const markAsNotified = async (id: string) => {
    setNotifyingId(id)
    const notes = callNotes[id] || ''
    const { error } = await supabase.from('appointments').update({ 
      cancellation_notified: true,
      cancellation_notified_notes: notes 
    }).eq('id', id)
    if (!error) {
      setPendingCalls(prev => prev.filter(c => c.id !== id))
      setAllMonthApps(prev => prev.map(a => a.id === id ? { ...a, cancellation_notified: true } : a))
    }
    setNotifyingId(null)
  };

  const handleSendWhatsApp = async (appointment: Appointment) => {
    setSendingId(appointment.id)
    try {
      const res = await fetch('/api/appointments/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointment.id, tenant_id: tenantId })
      })
      if (res.ok) {
        setPendingCalls(prev => prev.filter(c => c.id !== appointment.id))
        setAllMonthApps(prev => prev.map(a => a.id === appointment.id ? { ...a, cancellation_notified: true } : a))
      } else {
        const data = await res.json()
        alert(data.error || 'Error sending message')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setSendingId(null)
    }
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: tu } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()

      const { data: prof } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (tu && prof) {
        setProfId(prof.id)
        setTenantId(tu.tenant_id)
        await Promise.all([
          fetchAppointments(prof.id, tu.tenant_id, currentMonth),
          fetchMeta(tu.tenant_id)
        ])
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (profId && tenantId) {
      fetchAppointments(profId, tenantId, currentMonth)
    }
  }, [currentMonth, profId, tenantId, fetchAppointments])

  // Filter for selected day
  const dayApps = allMonthApps.filter(a => 
    isSameDay(parseISO(a.start_at), selectedDate)
  )

  const calendarDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDayOfWeek = startOfMonth(currentMonth).getDay()

  const locale = (dateLocales as any)[language]

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 border-4 border-accent-500 border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{fullT.nav_calendar}</h1>
          <p className="text-sm font-bold text-primary-400 mt-1 uppercase tracking-widest">
            {format(new Date(), "EEEE d MMMM, yyyy", { locale })}
          </p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-accent-500 text-primary-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-accent-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent-500/20"
        >
          <Plus className="h-4 w-4" /> {translations[language]?.new_appointment || 'Nueva Cita'}
        </button>
      </div>

      {/* Pending Calls Reminder (Doctor View) */}
      {pendingCalls.length > 0 && (
        <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-[2rem] p-8 animate-in slide-in-from-top duration-700">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-red-100 flex items-center justify-center rounded-xl text-red-600">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-lg font-black text-red-900">{fullT.pending_notification_title}</h3>
                   <p className="text-sm text-red-600 font-medium">{language === 'es' ? 'Pacientes que deben ser avisados de la cancelación de su cita.' : 'Patients that must be notified about their app cancellation.'}</p>
                </div>
              </div>
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{pendingCalls.length}</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingCalls.map(call => (
                <div key={call.id} className="bg-white p-6 rounded-2xl border border-red-200/50 shadow-sm flex flex-col justify-between group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs">
                      {call.clients?.first_name[0]}{call.clients?.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-none">{call.clients?.first_name} {call.clients?.last_name}</p>
                      <p className="text-xs font-bold text-slate-400 mt-1">{call.clients?.phone}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <input 
                      type="text"
                      placeholder={fullT.notification_notes_placeholder}
                      value={callNotes[call.id] || ''}
                      onChange={(e) => setCallNotes(prev => ({ ...prev, [call.id]: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-600 placeholder:text-slate-300 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">{format(parseISO(call.start_at), "d MMM, HH:mm", { locale })}</span>
                     <div className="flex items-center gap-2">
                       <button 
                         onClick={() => handleSendWhatsApp(call)}
                         disabled={sendingId === call.id || notifyingId === call.id}
                         className="h-9 px-4 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                       >
                         {sendingId === call.id ? <Clock className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
                         {fullT.send_whatsapp}
                       </button>
                       <button 
                         onClick={() => markAsNotified(call.id)}
                         disabled={notifyingId === call.id || sendingId === call.id}
                         className="h-9 px-4 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                       >
                         {notifyingId === call.id ? <Clock className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                         {fullT.mark_as_notified}
                       </button>
                     </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-5">
          <div className="bg-primary-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl noise h-full">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 rounded-xl bg-primary-800/50 hover:bg-primary-700 text-primary-200 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-black text-white capitalize tracking-tight">
                {format(currentMonth, 'MMMM yyyy', { locale })}
              </h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 rounded-xl bg-primary-800/50 hover:bg-primary-700 text-primary-200 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (
                <div key={d} className="text-center text-[10px] font-black text-primary-400 uppercase tracking-widest">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
              {calendarDays.map(day => {
                const selected = isSameDay(day, selectedDate)
                const today = isToday(day)
                const hasApp = allMonthApps.some(a => isSameDay(parseISO(a.start_at), day))
                return (
                  <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-black transition-all duration-200
                      ${selected ? 'bg-accent-500 text-primary-950 shadow-xl shadow-accent-500/20 scale-110 z-10' : today ? 'bg-primary-800 text-accent-400 ring-2 ring-accent-500/30' : 'text-primary-200 hover:bg-primary-800/50'}`}>
                    {format(day, 'd')}
                    {hasApp && !selected && <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-accent-400" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Day Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent-500" />
              {format(selectedDate, "EEEE d MMMM", { locale })}
            </h3>
            <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest bg-primary-900/50 px-3 py-1.5 rounded-lg border border-white/5">
              {dayApps.length} {fullT.nav_calendar.toLowerCase()}
            </span>
          </div>

          {dayApps.length === 0 ? (
            <div className="bg-primary-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-16 text-center noise">
              <Calendar className="h-12 w-12 text-primary-800 mx-auto mb-4" />
              <p className="text-lg font-bold text-primary-400">{fullT.no_activity_today}</p>
              <p className="text-sm text-primary-500 mt-1">{language === 'es' ? '¡Disfruta tu tiempo libre! 🎉' : 'Enjoy your free time! 🎉'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayApps.map((app, idx) => (
                <div key={app.id} className="bg-primary-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-sm hover:bg-primary-800/40 transition-all group noise">
                  <div className="flex items-center gap-5">
                    {/* Time */}
                    <div className="h-14 w-14 rounded-2xl bg-primary-800/50 border border-white/5 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-accent-500 transition-all duration-300">
                      <span className="text-lg font-black leading-none group-hover:text-primary-950 text-accent-500">{format(parseISO(app.start_at), 'HH')}</span>
                      <span className="text-[10px] font-bold group-hover:text-primary-900 text-primary-400">{format(parseISO(app.start_at), 'mm')}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3.5 w-3.5 text-primary-500" />
                        <p className="text-sm font-bold text-white truncate">
                          {app.clients?.first_name} {app.clients?.last_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                        {app.services && (
                          <span className="flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" /> {app.services.name}
                          </span>
                        )}
                        {app.clients?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {app.clients.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest
                      ${app.status === 'confirmed' || app.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        app.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-accent-500/10 text-accent-500 border border-accent-500/20'}`}>
                      {app.status === 'confirmed' ? fullT.confirmed : app.status === 'completed' ? fullT.done :
                       app.status === 'cancelled' ? fullT.canceled : fullT.pending}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* New Appointment Drawer */}
      {showNewModal && tenantId && (
        <QuickAppointmentDrawer 
          tenantId={tenantId}
          lang={language}
          services={services}
          professionals={professionals}
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            fetchAppointments(profId, tenantId, currentMonth)
            setShowNewModal(false)
          }}
          selectedDate={selectedDate}
          translations={getTranslations(language)}
          availableSlots={availableSlots}
          slotLoading={slotLoading}
          onFetchSlots={fetchSlots}
        />
      )}
    </div>
  )
}
