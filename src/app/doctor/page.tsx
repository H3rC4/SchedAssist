"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Phone, Stethoscope, Plus, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react'
import { format, parseISO, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns'
import { translations, dateLocales, getTranslations } from '@/lib/i18n'
import { useLandingTranslation } from '@/components/LanguageContext'
import { QuickAppointmentDrawer } from '@/components/appointments/QuickAppointmentDrawer'

interface Appointment {
  id: string
  status: string
  start_at: string
  notes?: string
  cancellation_reason?: string
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
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null)

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
    if (!pId || !tenantId || !dateStr) {
      setAvailableSlots([])
      setIsBlocked(false)
      setBlockReason(null)
      return
    }
    setSlotLoading(true)
    try {
      const params = new URLSearchParams({ tenant_id: tenantId, professional_id: pId, date: dateStr })
      const res = await fetch(`/api/appointments/available-slots?${params}`)
      if (!res.ok) throw new Error('Failed to fetch slots')
      const data: { slots: string[]; isBlocked: boolean; blockReason: string | null } = await res.json()
      setAvailableSlots(data.slots)
      setIsBlocked(data.isBlocked)
      setBlockReason(data.blockReason)
    } catch (e) {
      console.error('[fetchSlots]', e)
      setAvailableSlots([])
      setIsBlocked(false)
      setBlockReason(null)
    } finally {
      setSlotLoading(false)
    }
  }, [tenantId])

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

  const dayApps = allMonthApps.filter(a => isSameDay(parseISO(a.start_at), selectedDate))
  const calendarDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDayOfWeek = startOfMonth(currentMonth).getDay()
  const locale = (dateLocales as any)[language]

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center bg-surface">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-surface min-h-screen p-4 md:p-8 animate-in fade-in duration-700">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* COMPACT HEADER */}
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-on-surface leading-tight uppercase">
                {fullT.nav_calendar}
              </h1>
              <p className="mt-1 text-[9px] font-black text-on-surface-muted uppercase tracking-[0.3em]">
                {format(new Date(), "EEEE d MMMM, yyyy", { locale })}
              </p>
            </div>
            <button 
              onClick={() => setShowNewModal(true)}
              className="flex items-center justify-center gap-3 px-6 py-3 bg-primary text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 shadow-lg group"
            >
              <span>{translations[language]?.new_appointment || 'Nuovo Appuntamento'}</span>
              <Plus className="h-[14px] w-[14px]" />
            </button>
          </div>
        </div>

        {/* PENDING CALLS (Clean Premium Version) */}
        {pendingCalls.length > 0 && (
          <div className="bg-white border border-red-500/10 rounded-[1.5rem] p-6 md:p-8 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-50 flex items-center justify-center rounded-[1rem] text-red-500">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                     <h3 className="text-sm font-black text-on-surface tracking-tighter uppercase">{fullT.pending_notification_title}</h3>
                     <p className="text-[10px] font-bold text-on-surface-muted uppercase tracking-widest mt-0.5">
                       {language === 'es' ? 'Pacientes pendientes de aviso' : 'Patients to notify'}
                     </p>
                  </div>
                </div>
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{pendingCalls.length}</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingCalls.map(call => (
                  <div key={call.id} className="bg-precision-surface-lowest p-5 rounded-[1rem] border border-on-surface/5 flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface font-black text-[10px]">
                        {call.clients?.first_name[0]}{call.clients?.last_name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-black text-on-surface uppercase tracking-tight truncate">{call.clients?.first_name} {call.clients?.last_name}</p>
                        <p className="text-[9px] font-bold text-on-surface-muted uppercase tracking-widest">{call.clients?.phone}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <input 
                        type="text"
                        placeholder={fullT.notification_notes_placeholder}
                        value={callNotes[call.id] || ''}
                        onChange={(e) => setCallNotes(prev => ({ ...prev, [call.id]: e.target.value }))}
                        className="w-full bg-white border border-on-surface/5 rounded-xl px-4 py-2.5 text-[10px] font-bold text-on-surface placeholder:text-on-surface-muted/50 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all uppercase tracking-wider"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                       <span className="text-[9px] font-black text-on-surface-muted uppercase tracking-widest">{format(parseISO(call.start_at), "d MMM, HH:mm", { locale })}</span>
                       <div className="flex items-center gap-2">
                         <button 
                           onClick={() => handleSendWhatsApp(call)}
                           disabled={sendingId === call.id || notifyingId === call.id}
                           className="h-8 px-3 rounded-lg bg-emerald-500 text-white text-[8px] font-black uppercase tracking-[0.1em] hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                         >
                           {sendingId === call.id ? <Clock className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
                           {fullT.send_whatsapp}
                         </button>
                         <button 
                           onClick={() => markAsNotified(call.id)}
                           disabled={notifyingId === call.id || sendingId === call.id}
                           className="h-8 px-3 rounded-lg bg-on-surface text-white text-[8px] font-black uppercase tracking-[0.1em] hover:bg-on-surface/80 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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

        {/* LAYOUT PRINCIPAL (Dos columnas) */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          
          {/* Day Feed List (65%) */}
          <div className="w-full lg:w-[65%] order-2 lg:order-1 flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-on-surface uppercase tracking-tighter flex items-center gap-2">
                {format(selectedDate, "EEEE d MMMM", { locale })}
              </h3>
              <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-full">
                {dayApps.length} {fullT.nav_calendar.toLowerCase()}
              </span>
            </div>

            {dayApps.length === 0 ? (
              <div className="bg-white border border-on-surface/5 rounded-[1.5rem] p-12 text-center shadow-sm">
                <div className="h-12 w-12 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-5 w-5 text-on-surface-muted" />
                </div>
                <p className="text-xs font-black text-on-surface uppercase tracking-tighter">{fullT.no_activity_today}</p>
                <p className="text-[9px] font-bold text-on-surface-muted uppercase tracking-widest mt-1">
                  {language === 'es' ? 'DISFRUTA TU TIEMPO LIBRE' : 'ENJOY YOUR FREE TIME'}
                </p>
              </div>
            ) : (
              <div className="relative pl-6 lg:pl-10 space-y-4 before:absolute before:inset-y-0 before:left-[11px] lg:before:left-[19px] before:w-[2px] before:bg-on-surface/[0.08]">
                {dayApps.map((app, idx) => {
                  const isPast = new Date(app.start_at) < new Date();
                  return (
                    <div key={app.id} className="relative group">
                      {/* Node */}
                      <div className={`absolute -left-[35px] lg:-left-[43px] top-6 h-5 w-5 rounded-full border-[4px] border-surface shadow-sm z-10 transition-colors duration-300 ${isPast ? 'bg-on-surface/20' : 'bg-primary ring-2 ring-primary/20'}`} />
                      
                      {/* Card */}
                      <button 
                        onClick={() => setSelectedApp(app)}
                        className="w-full text-left bg-white border border-primary/10 rounded-[1.5rem] p-5 lg:p-6 shadow-sm hover:shadow-md transition-all group-hover:-translate-y-0.5 group-hover:border-primary/30 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-5">
                          <div className="text-center">
                            <span className="block text-lg font-black text-on-surface leading-none tracking-tighter">{format(parseISO(app.start_at), 'HH:mm')}</span>
                            <span className="block text-[9px] font-bold text-on-surface-muted uppercase tracking-widest mt-1">
                               {app.status === 'confirmed' ? fullT.confirmed : app.status === 'completed' ? fullT.done : app.status === 'cancelled' ? fullT.canceled : fullT.pending}
                            </span>
                          </div>
                          
                          <div className="h-10 w-[1px] bg-on-surface/10 hidden sm:block"></div>
                          
                          <div>
                            <p className="text-sm font-black text-on-surface uppercase tracking-tight">{app.clients?.first_name} {app.clients?.last_name}</p>
                            <div className="flex items-center gap-3 text-[10px] text-on-surface-muted font-bold uppercase tracking-widest mt-1">
                              {app.services && (
                                <span className="flex items-center gap-1.5 text-primary">
                                  <Stethoscope className="h-3 w-3" /> {app.services.name}
                                </span>
                              )}
                              {app.clients?.phone && (
                                <span className="flex items-center gap-1.5">
                                  <Phone className="h-3 w-3" /> {app.clients.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="h-10 w-10 shrink-0 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Calendar Strip / Widget (35%) */}
          <div className="w-full lg:w-[35%] shrink-0 bg-white border border-on-surface/5 rounded-[1.5rem] p-6 md:p-8 shadow-sm order-1 lg:order-2 lg:sticky lg:top-8">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tighter">
                {format(currentMonth, 'MMMM yyyy', { locale })}
              </h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (
                <div key={d} className="text-center text-[9px] font-black text-on-surface-muted uppercase tracking-widest">{d}</div>
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
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-xs font-black transition-all duration-200
                      ${selected ? 'bg-primary text-white shadow-md scale-105 z-10' : 
                        today ? 'bg-surface-container-low text-primary ring-1 ring-primary/20' : 
                        'text-on-surface hover:bg-surface-container-low'}`}>
                    {format(day, 'd')}
                    {hasApp && !selected && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary" />}
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </div>
      
      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedApp(null)} />
          <div className="relative bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
             <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-surface-container-low flex items-center justify-center text-xl font-black text-primary tracking-tighter">
                      {selectedApp.clients?.first_name[0]}{selectedApp.clients?.last_name[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-on-surface uppercase tracking-tight leading-none mb-1">
                        {selectedApp.clients?.first_name} {selectedApp.clients?.last_name}
                      </h2>
                      <span className="text-[10px] font-bold text-on-surface-muted uppercase tracking-widest">
                        ID: #{selectedApp.id.slice(0,8)}
                      </span>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest
                    ${selectedApp.status === 'confirmed' || selectedApp.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                      selectedApp.status === 'cancelled' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>
                    {selectedApp.status === 'confirmed' ? fullT.confirmed : selectedApp.status === 'completed' ? fullT.done :
                     selectedApp.status === 'cancelled' ? fullT.canceled : fullT.pending}
                  </div>
                </div>

                <div className="space-y-6">
                   <div>
                      <h4 className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-3">Detalles de la Cita</h4>
                      <div className="bg-surface-container-lowest border border-on-surface/5 rounded-[1.5rem] p-5 space-y-4">
                         <div className="flex items-center gap-3">
                           <Clock className="h-4 w-4 text-primary" />
                           <div>
                             <p className="text-xs font-black text-on-surface uppercase tracking-tight">{format(parseISO(selectedApp.start_at), "EEEE d MMMM, yyyy", { locale })}</p>
                             <p className="text-[10px] font-bold text-on-surface-muted uppercase tracking-widest">{format(parseISO(selectedApp.start_at), "HH:mm")}</p>
                           </div>
                         </div>
                         {selectedApp.services && (
                           <div className="flex items-center gap-3">
                             <Stethoscope className="h-4 w-4 text-primary" />
                             <div>
                               <p className="text-xs font-black text-on-surface uppercase tracking-tight">{selectedApp.services.name}</p>
                               <p className="text-[10px] font-bold text-on-surface-muted uppercase tracking-widest">Servicio</p>
                             </div>
                           </div>
                         )}
                         {selectedApp.clients?.phone && (
                           <div className="flex items-center gap-3">
                             <Phone className="h-4 w-4 text-primary" />
                             <div>
                               <p className="text-xs font-black text-on-surface uppercase tracking-tight">{selectedApp.clients.phone}</p>
                               <p className="text-[10px] font-bold text-on-surface-muted uppercase tracking-widest">Teléfono</p>
                             </div>
                           </div>
                         )}
                      </div>
                   </div>

                   {selectedApp.notes && (
                     <div>
                        <h4 className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-3">Notas</h4>
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-[1.5rem] p-5 text-sm font-bold text-amber-900 leading-relaxed">
                          {selectedApp.notes}
                        </div>
                     </div>
                   )}
                </div>
             </div>
             <div className="p-6 bg-surface-container-lowest border-t border-on-surface/5 flex gap-3">
                <button onClick={() => setSelectedApp(null)} className="flex-1 py-4 bg-surface-container hover:bg-surface-container-high rounded-[1.5rem] text-xs font-black text-on-surface uppercase tracking-widest transition-colors">
                  Cerrar
                </button>
                <a href={`https://wa.me/${selectedApp.clients?.phone?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-[1.5rem] text-xs font-black text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </a>
             </div>
          </div>
        </div>
      )}

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
          isBlocked={isBlocked}
          blockReason={blockReason}
          onFetchSlots={fetchSlots}
        />
      )}
    </div>
  )
}
