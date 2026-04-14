"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Phone, Stethoscope } from 'lucide-react'
import { format, parseISO, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

interface Appointment {
  id: string
  status: string
  start_at: string
  clients: { first_name: string; last_name: string; phone: string } | null
  services: { name: string } | null
}

export default function DoctorDashboard() {
  const supabase = createClient()
  const [profId, setProfId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [allMonthApps, setAllMonthApps] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

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
    }
  }, [supabase])

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
        await fetchAppointments(prof.id, tu.tenant_id, currentMonth)
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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis Citas</h1>
        <p className="text-sm font-medium text-slate-400 mt-1">
          {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-black text-slate-900 capitalize tracking-tight">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (
                <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
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
                      ${selected ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20 scale-110 z-10' : today ? 'bg-amber-50 text-amber-600 ring-2 ring-amber-200' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {format(day, 'd')}
                    {hasApp && !selected && <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Day Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-500" />
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg">
              {dayApps.length} cita{dayApps.length !== 1 ? 's' : ''}
            </span>
          </div>

          {dayApps.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
              <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-lg font-bold text-slate-300">Sin citas para este día</p>
              <p className="text-sm text-slate-300 mt-1">Disfruta tu tiempo libre 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayApps.map((app, idx) => (
                <div key={app.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center gap-5">
                    {/* Time */}
                    <div className="h-14 w-14 rounded-xl bg-amber-50 border border-amber-100 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <span className="text-lg font-black leading-none group-hover:text-white text-amber-600">{format(parseISO(app.start_at), 'HH')}</span>
                      <span className="text-[10px] font-bold group-hover:text-amber-100 text-amber-400">{format(parseISO(app.start_at), 'mm')}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <p className="text-sm font-bold text-slate-900 truncate">
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
                    <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest
                      ${app.status === 'confirmed' || app.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        app.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
                      {app.status === 'confirmed' ? 'Confirmado' : app.status === 'completed' ? 'Completado' :
                       app.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
