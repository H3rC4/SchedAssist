"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO, addDays, startOfToday, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  MapPin, 
  ChevronRight, 
  User, 
  Clock, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Loader2,
  Stethoscope,
  ChevronLeft,
  Phone,
  Mail,
  UserCheck,
  MessageCircle,
  Send
} from 'lucide-react'
import { translations, Language } from '@/lib/i18n'

export default function BookingPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<any>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  
  // Selection State
  const [step, setStep] = useState(1)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  
  // Client Info
  const [clientInfo, setClientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  })

  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // Load Initial Data
  useEffect(() => {
    async function loadTenantData() {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!tenantData) {
        setLoading(false)
        return
      }

      setTenant(tenantData)
      
      // Inject primary color
      if (tenantData.settings?.primary_color) {
        document.documentElement.style.setProperty('--primary', tenantData.settings.primary_color)
      }

      const [locs, servs, pros] = await Promise.all([
        supabase.from('locations').select('*').eq('tenant_id', tenantData.id).eq('active', true),
        supabase.from('services').select('*').eq('tenant_id', tenantData.id).eq('active', true),
        supabase.from('professionals').select('*').eq('tenant_id', tenantData.id).eq('active', true)
      ])

      setLocations(locs.data || [])
      setServices(servs.data || [])
      setProfessionals(pros.data || [])
      setLoading(false)

      // Skip location step if only one
      if (locs.data?.length === 1) {
        setSelectedLocation(locs.data[0])
        setStep(2)
      } else if (locs.data?.length === 0) {
        setStep(2)
      }
    }

    loadTenantData()
  }, [slug, supabase])

  // Fetch Slots when Date/Professional/Service changes
  const fetchSlots = useCallback(async () => {
    if (!tenant || !selectedService || !selectedDate) return
    
    // If no professional selected, we can't show slots unless we check all of them
    // For now, require professional selection or show first available
    if (!selectedProfessional) return

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const dayOfWeek = selectedDate.getDay()

    const { data: rules } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('professional_id', selectedProfessional.id)
      .eq('day_of_week', dayOfWeek)
      .eq('active', true)

    if (!rules || rules.length === 0) {
      setAvailableSlots([])
      return
    }

    const { data: existingApps } = await supabase
      .from('appointments')
      .select('start_at, end_at')
      .eq('professional_id', selectedProfessional.id)
      .neq('status', 'cancelled')
      .gte('start_at', `${dateStr}T00:00:00Z`)
      .lte('start_at', `${dateStr}T23:59:59Z`)

    const slots: string[] = []
    const now = new Date()

    for (const rule of rules) {
      let current = parseISO(`${dateStr}T${rule.start_time}`)
      const endRule = parseISO(`${dateStr}T${rule.end_time}`)

      while (current < endRule) {
        const slotStart = new Date(current)
        const slotEnd = new Date(current.getTime() + (selectedService.duration_minutes || 30) * 60000)

        // Prevent past slots
        if (slotStart < now) {
          current = new Date(current.getTime() + 15 * 60000)
          continue
        }

        const isOccupied = existingApps?.some(a => {
          const appStart = parseISO(a.start_at)
          const appEnd = parseISO(a.end_at)
          return appStart < slotEnd && appEnd > slotStart
        })

        if (!isOccupied) {
          slots.push(format(slotStart, 'HH:mm'))
        }
        current = new Date(current.getTime() + 15 * 60000) // 15 min granularity
      }
    }

    setAvailableSlots(slots)
  }, [tenant, selectedService, selectedProfessional, selectedDate, supabase])

  useEffect(() => {
    if (step === 4) fetchSlots()
  }, [step, fetchSlots])

  const handleBooking = async () => {
    setBookingStatus('loading')
    try {
      // 1. Create or Find Client
      let clientId: string
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('phone', clientInfo.phone)
        .single()

      if (existingClient) {
        clientId = existingClient.id
      } else {
        const { data: newClient, error: cErr } = await supabase
          .from('clients')
          .insert([{
            tenant_id: tenant.id,
            first_name: clientInfo.firstName,
            last_name: clientInfo.lastName,
            email: clientInfo.email,
            phone: clientInfo.phone
          }])
          .select()
          .single()
        
        if (cErr) throw cErr
        clientId = newClient.id
      }

      // 2. Create Appointment
      const startAt = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedSlot}:00Z`
      const duration = selectedService.duration_minutes || 30
      const endAt = new Date(parseISO(startAt).getTime() + duration * 60000).toISOString()

      const { error: appErr } = await supabase
        .from('appointments')
        .insert([{
          tenant_id: tenant.id,
          client_id: clientId,
          professional_id: selectedProfessional.id,
          service_id: selectedService.id,
          location_id: selectedLocation?.id || null,
          start_at: startAt,
          end_at: endAt,
          status: 'pending',
          source: 'public_portal',
          notes: clientInfo.notes
        }])

      if (appErr) throw appErr
      setBookingStatus('success')
    } catch (err) {
      console.error(err)
      setBookingStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
        <Loader2 className="h-12 w-12 animate-spin text-accent-500" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120] p-6 text-center">
        <div>
          <h1 className="text-2xl font-black text-white mb-2">Clínica no encontrada</h1>
          <p className="text-slate-400">El enlace que has seguido no parece ser válido.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B1120] selection:bg-accent-500/30 selection:text-accent-300 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-900/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Dynamic Header / Branding */}
      <header className="relative z-30 border-b border-white/5 bg-[#0B1120]/50 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.settings?.logo_url ? (
              <img src={tenant.settings.logo_url} alt={tenant.name} className="h-10 w-auto object-contain drop-shadow-lg" />
            ) : (
              <div className="h-10 w-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-primary-900/50">
                {tenant.name[0]}
              </div>
            )}
            <h1 className="text-lg font-black text-white truncate max-w-[200px] sm:max-w-md tracking-tight">
              {tenant.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
             <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Portal de Citas</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12 relative z-20">
        {bookingStatus === 'success' ? (
          <div className="bg-primary-900/20 backdrop-blur-xl rounded-[3rem] p-12 text-center shadow-2xl border border-white/10 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <CheckCircle2 className="h-12 w-12 text-accent-500" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">¡Cita Solicitada!</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              Hemos recibido tu solicitud para el <strong className="text-white">{format(selectedDate, "d 'de' MMMM", { locale: es })}</strong> a las <strong className="text-white">{selectedSlot}</strong>. 
              Te enviaremos una confirmación pronto.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-accent-500 text-primary-950 font-black uppercase tracking-[0.2em] text-xs px-10 py-5 rounded-2xl hover:bg-accent-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              Nueva Cita
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* PROGRESS BAR */}
            <div className="flex gap-2 px-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${
                    s < step ? 'bg-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : s === step ? 'bg-accent-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/5'
                  }`} 
                />
              ))}
            </div>

            {/* STEP CONTENT */}
            <div className="bg-primary-900/10 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-white/5 min-h-[400px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              
              {/* STEP 1: LOCATION */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Selecciona la Sede</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">¿A cuál sucursal deseas asistir?</p>
                  </div>
                  <div className="grid gap-4">
                    {locations.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => { setSelectedLocation(loc); setStep(2); }}
                        className="flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-white/5 hover:border-accent-500/50 hover:bg-accent-500/5 transition-all group"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-12 h-12 bg-primary-900/50 rounded-2xl flex items-center justify-center text-primary-400 group-hover:text-accent-500 group-hover:bg-accent-500/10 border border-white/5 transition-all">
                            <MapPin className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-black text-white group-hover:text-accent-50 transition-colors">{loc.name}</h4>
                            <p className="text-xs font-bold text-slate-500 group-hover:text-slate-400 transition-colors">{loc.address}, {loc.city}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-slate-600 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: SERVICE */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2 tracking-tight">¿Qué servicio necesitas?</h2>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Elige el tipo de consulta</p>
                    </div>
                    {locations.length > 1 && (
                      <button onClick={() => setStep(1)} className="text-[10px] font-black text-primary-400 hover:text-white uppercase tracking-widest bg-primary-900/30 hover:bg-primary-900/50 border border-white/5 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all">
                        <ChevronLeft className="h-3 w-3" /> Cambiar Sede
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4">
                    {services.map(serv => (
                      <button
                        key={serv.id}
                        onClick={() => { setSelectedService(serv); setStep(3); }}
                        className="flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-white/5 hover:border-accent-500/50 hover:bg-accent-500/5 transition-all group"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-12 h-12 bg-primary-900/50 rounded-2xl flex items-center justify-center text-primary-400 group-hover:text-accent-500 group-hover:bg-accent-500/10 border border-white/5 transition-all">
                            <Stethoscope className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-black text-white group-hover:text-accent-50 transition-colors">{serv.name}</h4>
                            <p className="text-xs font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-widest flex items-center gap-2 transition-colors">
                              <Clock className="h-3 w-3" /> {serv.duration_minutes} min • ${serv.price}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-slate-600 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: PROFESSIONAL */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Elige el Profesional</h2>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Personaliza tu atención</p>
                    </div>
                    <button onClick={() => setStep(2)} className="text-[10px] font-black text-primary-400 hover:text-white uppercase tracking-widest bg-primary-900/30 hover:bg-primary-900/50 border border-white/5 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all">
                      <ChevronLeft className="h-3 w-3" /> Cambiar Servicio
                    </button>
                  </div>
                  <div className="grid gap-4">
                    {professionals
                      .filter(p => !selectedLocation || !p.location_id || p.location_id === selectedLocation.id)
                      .map(prof => (
                      <button
                        key={prof.id}
                        onClick={() => { setSelectedProfessional(prof); setStep(4); }}
                        className="flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-white/5 hover:border-accent-500/50 hover:bg-accent-500/5 transition-all group"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-12 h-12 bg-primary-900/50 rounded-2xl flex items-center justify-center text-primary-400 group-hover:text-accent-500 group-hover:bg-accent-500/10 border border-white/5 transition-all overflow-hidden">
                            <User className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-black text-white group-hover:text-accent-50 transition-colors">{prof.full_name}</h4>
                            <p className="text-xs font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-widest transition-colors">{prof.specialty || 'Especialista'}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-slate-600 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: DATE & TIME */}
              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col flex-1 relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Fecha y Hora</h2>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">¿Cuándo te viene mejor?</p>
                    </div>
                    <button onClick={() => setStep(3)} className="text-[10px] font-black text-primary-400 hover:text-white uppercase tracking-widest bg-primary-900/30 hover:bg-primary-900/50 border border-white/5 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all">
                      <ChevronLeft className="h-3 w-3" /> Cambiar Profesional
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                    {/* Date Selector */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Próximos 7 días</p>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 9 }).map((_, i) => {
                          const date = addDays(new Date(), i)
                          const isSelected = isSameDay(date, selectedDate)
                          return (
                            <button
                              key={i}
                              onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                                isSelected 
                                  ? 'border-accent-500 bg-accent-500/10 text-accent-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                                  : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{format(date, 'EEE', { locale: es })}</span>
                              <span className="text-lg font-black">{format(date, 'd')}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-4 flex flex-col">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Horarios Disponibles</p>
                      <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                        {availableSlots.length === 0 ? (
                          <div className="col-span-3 py-12 text-center text-slate-500 italic text-sm">
                            No hay horarios disponibles para este día.
                          </div>
                        ) : (
                          availableSlots.map(slot => (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-3 rounded-xl border text-sm font-black transition-all ${
                                selectedSlot === slot 
                                  ? 'border-accent-500 bg-accent-500 text-primary-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                                  : 'border-white/5 bg-white/5 text-slate-300 hover:border-white/10 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {slot}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5">
                    <button
                      disabled={!selectedSlot}
                      onClick={() => setStep(5)}
                      className="w-full bg-accent-500 text-primary-950 font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl hover:bg-accent-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-30 disabled:pointer-events-none"
                    >
                      Continuar al Paso Final
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: CLIENT INFO */}
              {step === 5 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Tus Datos</h2>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Casi hemos terminado</p>
                    </div>
                    <button onClick={() => setStep(4)} className="text-[10px] font-black text-primary-400 hover:text-white uppercase tracking-widest bg-primary-900/30 hover:bg-primary-900/50 border border-white/5 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all">
                      <ChevronLeft className="h-3 w-3" /> Cambiar Horario
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> Nombre
                      </label>
                      <input 
                        type="text" 
                        placeholder="Tu nombre"
                        value={clientInfo.firstName}
                        onChange={e => setClientInfo({...clientInfo, firstName: e.target.value})}
                        className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-bold text-white placeholder-slate-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> Apellido
                      </label>
                      <input 
                        type="text" 
                        placeholder="Tu apellido"
                        value={clientInfo.lastName}
                        onChange={e => setClientInfo({...clientInfo, lastName: e.target.value})}
                        className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-bold text-white placeholder-slate-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Teléfono
                      </label>
                      <input 
                        type="tel" 
                        placeholder="+54 9 11 ..."
                        value={clientInfo.phone}
                        onChange={e => setClientInfo({...clientInfo, phone: e.target.value})}
                        className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-bold text-white placeholder-slate-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email (Opcional)
                      </label>
                      <input 
                        type="email" 
                        placeholder="tu@email.com"
                        value={clientInfo.email}
                        onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                        className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-bold text-white placeholder-slate-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-primary-900/30 rounded-3xl p-6 border border-primary-500/20 flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary-500/20 border border-primary-500/30 rounded-2xl flex items-center justify-center text-primary-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <CalendarIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{format(selectedDate, "d 'de' MMMM", { locale: es })}</p>
                        <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">{selectedSlot} • {selectedProfessional?.full_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Total</p>
                       <p className="text-xl font-black text-white">${selectedService?.price}</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleBooking}
                    disabled={bookingStatus === 'loading' || !clientInfo.firstName || !clientInfo.phone}
                    className="w-full bg-accent-500 text-primary-950 font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl hover:bg-accent-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {bookingStatus === 'loading' ? 'Confirmando...' : 'Confirmar Reserva'}
                  </button>
                </div>
              )}
            </div>

            {/* SUMMARY FOOTER */}
            {step > 1 && (
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] p-6 text-white flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-4">
                   <div className="hidden sm:flex h-10 w-10 bg-primary-900/50 border border-white/5 rounded-xl items-center justify-center">
                     <User className="h-5 w-5 text-primary-400" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resumen</p>
                     <p className="text-xs font-bold text-slate-300 truncate max-w-[200px]">
                       {selectedService?.name}{selectedProfessional ? ` con ${selectedProfessional.full_name}` : ''}
                     </p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Paso {step} de 5</p>
                   <p className="text-xs font-bold text-accent-500">{step === 5 ? 'Finalizar' : 'Siguiente: ' + (step === 2 ? 'Profesional' : step === 3 ? 'Horario' : 'Tus Datos')}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FLOATING BOTS */}
      <div className="fixed bottom-8 left-8 flex flex-col gap-3 z-50">
        {tenant?.settings?.whatsapp_bot_url && (
          <a 
            href={tenant.settings.whatsapp_bot_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-[#25D366] text-white p-4 rounded-2xl shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:scale-110 active:scale-95 transition-all animate-in slide-in-from-left-8 duration-700"
          >
            <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap">
              <span className="px-2 font-black uppercase tracking-widest text-[10px]">{translations[(tenant.settings.language as Language) || 'es'].chat_whatsapp}</span>
            </div>
            <MessageCircle className="h-6 w-6 drop-shadow-md" />
          </a>
        )}
        {tenant?.settings?.telegram_bot_url && (
          <a 
            href={tenant.settings.telegram_bot_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-[#0088cc] text-white p-4 rounded-2xl shadow-[0_0_20px_rgba(0,136,204,0.3)] hover:scale-110 active:scale-95 transition-all animate-in slide-in-from-left-8 duration-1000"
          >
            <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap">
              <span className="px-2 font-black uppercase tracking-widest text-[10px]">{translations[(tenant.settings.language as Language) || 'es'].chat_telegram}</span>
            </div>
            <Send className="h-6 w-6 drop-shadow-md" />
          </a>
        )}
      </div>

      <style jsx global>{`
        /* Custom Scrollbar for Dark Theme */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  )
}
