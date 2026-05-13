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
import { motion } from 'framer-motion'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

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
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState<string | null>(null)
  
  const primaryColor = tenant?.settings?.primary_color || '#005c55'
  const secondaryColor = tenant?.settings?.secondary_color || '#855300'
  
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
      
      // Inject colors
      if (tenantData.settings?.primary_color) {
        document.documentElement.style.setProperty('--primary', tenantData.settings.primary_color)
      }
      if (tenantData.settings?.secondary_color) {
        document.documentElement.style.setProperty('--secondary', tenantData.settings.secondary_color)
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
    if (!tenant || !selectedService || !selectedDate || !selectedProfessional) {
      setAvailableSlots([])
      setIsBlocked(false)
      setBlockReason(null)
      return
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const params = new URLSearchParams({
      tenant_id: tenant.id,
      professional_id: selectedProfessional.id,
      date: dateStr,
      service_id: selectedService.id,
    })

    try {
      const res = await fetch(`/api/appointments/available-slots?${params}`)
      if (!res.ok) throw new Error('Failed to fetch slots')
      const data: { slots: string[]; isBlocked: boolean; blockReason: string | null } = await res.json()
      setAvailableSlots(data.slots)
      setIsBlocked(data.isBlocked)
      setBlockReason(data.blockReason)
    } catch (e) {
      console.error('[booking fetchSlots]', e)
      setAvailableSlots([])
      setIsBlocked(false)
      setBlockReason(null)
    }
  }, [tenant, selectedService, selectedProfessional, selectedDate])

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
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="relative">
          <div className="h-12 w-12 border-4 rounded-full animate-spin" style={{ borderColor: hexToRgba(primaryColor, 0.1), borderTopColor: primaryColor }} />
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6 text-center">
        <div className="max-w-md">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}>
            <MapPin className="h-8 w-8" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">Clínica no encontrada</h1>
          <p className="text-sm font-bold text-[#191c1e]/40">El enlace que has seguido no parece ser válido.</p>
        </div>
      </div>
    )
  }

  const tLang = (tenant.settings?.language as Language) || 'es'
  const t = translations[tLang] || translations['es']

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20 text-[#191c1e] relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 opacity-[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" style={{ backgroundColor: primaryColor }} />

      {/* Dynamic Header / Branding */}
      <header className="relative z-30 border-b border-on-surface/5 bg-white/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.settings?.logo_url ? (
              <img src={tenant.settings.logo_url} alt={tenant.name} className="h-10 w-auto object-contain" />
            ) : (
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg" style={{ backgroundColor: primaryColor }}>
                {tenant.name[0]}
              </div>
            )}
            <h1 className="text-lg font-black text-[#191c1e] truncate max-w-[200px] sm:max-w-md tracking-tight">
              {tenant.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 border px-3 py-1.5 rounded-full backdrop-blur-md" style={{ borderColor: hexToRgba(primaryColor, 0.1), backgroundColor: hexToRgba(primaryColor, 0.03) }}>
             <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: secondaryColor }} />
             <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>Portal de Citas</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12 relative z-20">
        {bookingStatus === 'success' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-10 md:p-12 text-center shadow-card border border-on-surface/5"
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border" style={{ backgroundColor: hexToRgba(secondaryColor, 0.1), borderColor: hexToRgba(secondaryColor, 0.2) }}>
              <CheckCircle2 className="h-10 w-10" style={{ color: secondaryColor }} />
            </div>
            <h2 className="text-3xl font-black text-[#191c1e] mb-3 tracking-tighter uppercase">Cita Solicitada</h2>
            <p className="text-sm font-bold text-[#191c1e]/40 mb-8 max-w-md mx-auto leading-relaxed">
              Hemos recibido tu solicitud para el <strong className="text-[#191c1e]">{format(selectedDate, "d 'de' MMMM", { locale: es })}</strong> a las <strong className="text-[#191c1e]">{selectedSlot}</strong>. 
              Te enviaremos una confirmación pronto.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="font-black uppercase tracking-[0.2em] text-xs px-10 py-4 rounded-xl transition-all active:scale-95 text-white shadow-lg"
              style={{ backgroundColor: secondaryColor }}
            >
              Nueva Cita
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* PROGRESS BAR */}
            <div className="flex gap-2 px-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div 
                  key={s} 
                  className="h-1.5 flex-1 rounded-full transition-all duration-700"
                  style={{
                    backgroundColor: s < step ? primaryColor : s === step ? secondaryColor : 'rgba(0,0,0,0.05)'
                  }}
                />
              ))}
            </div>

            {/* STEP CONTENT */}
            <div className="bg-white rounded-2xl p-6 md:p-10 shadow-card border border-on-surface/5 min-h-[400px] flex flex-col relative overflow-hidden">
              
              {/* STEP 1: LOCATION */}
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">Selecciona la Sede</h2>
                    <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">¿A cuál sucursal deseas asistir?</p>
                  </div>
                  <div className="grid gap-3">
                    {locations.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => { setSelectedLocation(loc); setStep(2); }}
                        className="flex items-center justify-between p-5 md:p-6 rounded-xl border border-on-surface/5 bg-surface hover:border-primary/30 hover:bg-white transition-all group text-left"
                        style={{ '--tw-border-opacity': 1 } as React.CSSProperties}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-on-surface/5 transition-all group-hover:shadow-md" style={{ backgroundColor: hexToRgba(primaryColor, 0.05) }}>
                            <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                          </div>
                          <div>
                            <h4 className="font-black text-[#191c1e] group-hover:text-primary transition-colors">{loc.name}</h4>
                            <p className="text-xs font-bold text-[#191c1e]/30">{loc.address}, {loc.city}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-[#191c1e]/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: SERVICE */}
              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">¿Qué servicio necesitas?</h2>
                      <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">Elige el tipo de consulta</p>
                    </div>
                    {locations.length > 1 && (
                      <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-on-surface/5 hover:bg-surface transition-all flex items-center gap-1" style={{ color: primaryColor }}>
                        <ChevronLeft className="h-3 w-3" /> Cambiar Sede
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3">
                    {services.map(serv => (
                      <button
                        key={serv.id}
                        onClick={() => { setSelectedService(serv); setStep(3); }}
                        className="flex items-center justify-between p-5 md:p-6 rounded-xl border border-on-surface/5 bg-surface hover:border-primary/30 hover:bg-white transition-all group text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-on-surface/5 transition-all group-hover:shadow-md" style={{ backgroundColor: hexToRgba(primaryColor, 0.05) }}>
                            <Stethoscope className="h-5 w-5" style={{ color: primaryColor }} />
                          </div>
                          <div>
                            <h4 className="font-black text-[#191c1e] group-hover:text-primary transition-colors">{serv.name}</h4>
                            <p className="text-xs font-bold text-[#191c1e]/30 flex items-center gap-2">
                              <Clock className="h-3 w-3" /> {serv.duration_minutes} min • ${serv.price}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-[#191c1e]/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: PROFESSIONAL */}
              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">Elige el Profesional</h2>
                      <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">Personaliza tu atención</p>
                    </div>
                    <button onClick={() => setStep(2)} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-on-surface/5 hover:bg-surface transition-all flex items-center gap-1" style={{ color: primaryColor }}>
                      <ChevronLeft className="h-3 w-3" /> Cambiar Servicio
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {professionals
                      .filter(p => !selectedLocation || !p.location_id || p.location_id === selectedLocation.id)
                      .map(prof => (
                      <button
                        key={prof.id}
                        onClick={() => { setSelectedProfessional(prof); setStep(4); }}
                        className="flex items-center justify-between p-5 md:p-6 rounded-xl border border-on-surface/5 bg-surface hover:border-primary/30 hover:bg-white transition-all group text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-on-surface/5 transition-all group-hover:shadow-md" style={{ backgroundColor: hexToRgba(primaryColor, 0.05) }}>
                            <User className="h-5 w-5" style={{ color: primaryColor }} />
                          </div>
                          <div>
                            <h4 className="font-black text-[#191c1e] group-hover:text-primary transition-colors">{prof.full_name}</h4>
                            <p className="text-xs font-bold text-[#191c1e]/30">{prof.specialty || 'Especialista'}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-[#191c1e]/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: DATE & TIME */}
              {step === 4 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col flex-1 relative z-10"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">Fecha y Hora</h2>
                      <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">¿Cuándo te viene mejor?</p>
                    </div>
                    <button onClick={() => setStep(3)} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-on-surface/5 hover:bg-surface transition-all flex items-center gap-1" style={{ color: primaryColor }}>
                      <ChevronLeft className="h-3 w-3" /> Cambiar Profesional
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                    {/* Date Selector */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-[#191c1e]/30 uppercase tracking-[0.4em] ml-1">Próximos 7 días</p>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 9 }).map((_, i) => {
                          const date = addDays(new Date(), i)
                          const isSelected = isSameDay(date, selectedDate)
                          return (
                            <button
                              key={i}
                              onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                              className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border transition-all ${
                                isSelected 
                                  ? 'text-white shadow-lg' 
                                  : 'border-on-surface/5 bg-surface text-[#191c1e]/40 hover:border-on-surface/10 hover:bg-white hover:text-[#191c1e]'
                              }`}
                              style={isSelected ? { backgroundColor: secondaryColor, borderColor: secondaryColor } : undefined}
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
                      <p className="text-[10px] font-black text-[#191c1e]/30 uppercase tracking-[0.4em] ml-1">Horarios Disponibles</p>
                      <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                        {isBlocked ? (
                          <div className="col-span-3 py-10 text-center">
                            <p className="text-sm font-black text-red-600 uppercase tracking-widest mb-1">Profesional no disponible</p>
                            {blockReason && <p className="text-xs text-red-400/60 font-semibold">{blockReason}</p>}
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="col-span-3 py-12 text-center text-[#191c1e]/30 italic text-sm font-bold">
                            No hay horarios disponibles para este día.
                          </div>
                        ) : (
                          availableSlots.map(slot => (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-3 rounded-xl border text-sm font-black transition-all ${
                                selectedSlot === slot 
                                  ? 'text-white shadow-lg' 
                                  : 'border-on-surface/5 bg-surface text-[#191c1e]/50 hover:border-on-surface/10 hover:bg-white hover:text-[#191c1e]'
                              }`}
                              style={selectedSlot === slot ? { backgroundColor: secondaryColor, borderColor: secondaryColor } : undefined}
                            >
                              {slot}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-on-surface/5">
                    <button
                      disabled={!selectedSlot || isBlocked}
                      onClick={() => setStep(5)}
                      className="w-full font-black uppercase tracking-[0.2em] text-xs py-4 rounded-xl transition-all active:scale-95 text-white shadow-lg disabled:opacity-30 disabled:pointer-events-none"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      Continuar al Paso Final
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: CLIENT INFO */}
              {step === 5 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-[#191c1e] mb-2 tracking-tighter uppercase">Tus Datos</h2>
                      <p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">Casi hemos terminado</p>
                    </div>
                    <button onClick={() => setStep(4)} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-on-surface/5 hover:bg-surface transition-all flex items-center gap-1" style={{ color: primaryColor }}>
                      <ChevronLeft className="h-3 w-3" /> Cambiar Horario
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
                        <UserCheck className="h-3 w-3" /> Nombre
                      </label>
                      <input 
                        type="text" 
                        placeholder="Tu nombre"
                        value={clientInfo.firstName}
                        onChange={e => setClientInfo({...clientInfo, firstName: e.target.value})}
                        className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-5 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
                        <UserCheck className="h-3 w-3" /> Apellido
                      </label>
                      <input 
                        type="text" 
                        placeholder="Tu apellido"
                        value={clientInfo.lastName}
                        onChange={e => setClientInfo({...clientInfo, lastName: e.target.value})}
                        className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-5 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> Teléfono
                      </label>
                      <input 
                        type="tel" 
                        placeholder="+54 9 11 ..."
                        value={clientInfo.phone}
                        onChange={e => setClientInfo({...clientInfo, phone: e.target.value})}
                        className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-5 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> Email (Opcional)
                      </label>
                      <input 
                        type="email" 
                        placeholder="tu@email.com"
                        value={clientInfo.email}
                        onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                        className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-5 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl p-6 border mb-8 flex items-center justify-between" style={{ backgroundColor: hexToRgba(primaryColor, 0.03), borderColor: hexToRgba(primaryColor, 0.1) }}>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center border" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), borderColor: hexToRgba(primaryColor, 0.15) }}>
                        <CalendarIcon className="h-6 w-6" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#191c1e]">{format(selectedDate, "d 'de' MMMM", { locale: es })}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>{selectedSlot} • {selectedProfessional?.full_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-[#191c1e]/30 uppercase tracking-widest">Total</p>
                       <p className="text-xl font-black text-[#191c1e]">${selectedService?.price}</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleBooking}
                    disabled={bookingStatus === 'loading' || !clientInfo.firstName || !clientInfo.phone}
                    className="w-full font-black uppercase tracking-[0.2em] text-xs py-4 rounded-xl transition-all active:scale-95 text-white shadow-lg disabled:opacity-30 disabled:pointer-events-none"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    {bookingStatus === 'loading' ? 'Confirmando...' : 'Confirmar Reserva'}
                  </button>
                </motion.div>
              )}
            </div>

            {/* SUMMARY FOOTER */}
            {step > 1 && (
              <div className="bg-white border border-on-surface/5 rounded-2xl p-6 shadow-card flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="hidden sm:flex h-10 w-10 rounded-xl items-center justify-center border border-on-surface/5" style={{ backgroundColor: hexToRgba(primaryColor, 0.05) }}>
                     <User className="h-5 w-5" style={{ color: primaryColor }} />
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-[#191c1e]/30 uppercase tracking-widest">Resumen</p>
                     <p className="text-xs font-bold text-[#191c1e]/60 truncate max-w-[200px]">
                       {selectedService?.name}{selectedProfessional ? ` con ${selectedProfessional.full_name}` : ''}
                     </p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-[#191c1e]/30 uppercase tracking-widest">Paso {step} de 5</p>
                   <p className="text-xs font-black" style={{ color: secondaryColor }}>{step === 5 ? 'Finalizar' : 'Siguiente: ' + (step === 2 ? 'Profesional' : step === 3 ? 'Horario' : 'Tus Datos')}</p>
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
            className="group flex items-center gap-3 bg-[#25D366] text-white p-4 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"
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
            className="group flex items-center gap-3 bg-[#0088cc] text-white p-4 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"
          >
            <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap">
              <span className="px-2 font-black uppercase tracking-widest text-[10px]">{translations[(tenant.settings.language as Language) || 'es'].chat_telegram}</span>
            </div>
            <Send className="h-6 w-6 drop-shadow-md" />
          </a>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
}
