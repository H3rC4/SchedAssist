"use client"

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Clock, User, Phone, Stethoscope, MessageSquare, X, Trash2, Calendar, LayoutDashboard, Check, Briefcase, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { it } from 'date-fns/locale/it'
import { enUS } from 'date-fns/locale/en-US'

// ── i18n strings ──────────────────────────────────────────────────────────────
const i18n = {
  es: {
    title: 'Agenda Virtual', subtitle: 'Control total de turnos y disponibilidad',
    newBtn: 'AGENDAR TURNO MANUAL', dailyView: 'Visión Diaria', appointments: 'TURNOS ACTIVOS',
    noActivity: 'Sin actividad registrada para hoy', createFirst: 'Crear primer turno →',
    modalTitle: 'Agendar Turno', modalSubtitle: 'Carga manual de paciente',
    searchPatient: 'Buscar paciente existente', searchPlaceholder: 'Nombre, apellido o teléfono...',
    orNew: 'O ingresar nuevo paciente',
    whenLabel: '¿Para cuándo?', nameLabel: 'Nombre', lastNameLabel: 'Apellido',
    phoneLabel: 'WhatsApp / Contacto', serviceLabel: 'Servicio', profLabel: 'Especialista',
    slotsLabel: 'Horarios Disponibles', noSlots: 'Sin turnos para el día seleccionado.',
    reserving: 'Reservando...', confirm: 'FINALIZAR RESERVA',
    cancelTitle: '¿Seguro que deseas cancelar este turno?',
    phone: 'Teléfono', professional: 'Profesional', notes: 'Notas de interés',
    cancelBtn: 'Cancelar Cita', confirmed: 'Confirmado', reminder: 'Recordatorio',
    selectOption: 'Selecciona...',
    errOccupied: 'El profesional ya tiene una cita reservada para ese horario.',
    errNotWorking: 'El profesional no atiende en el horario seleccionado.',
    errGeneric: 'Error al crear el turno.',
  },
  it: {
    title: 'Agenda Virtuale', subtitle: 'Controllo totale appuntamenti e disponibilità',
    newBtn: 'NUOVO APPUNTAMENTO', dailyView: 'Vista Giornaliera', appointments: 'APPUNTAMENTI',
    noActivity: 'Nessun appuntamento registrato per oggi', createFirst: 'Crea primo appuntamento →',
    modalTitle: 'Prenota Appuntamento', modalSubtitle: 'Inserimento manuale paziente',
    searchPatient: 'Cerca paziente esistente', searchPlaceholder: 'Nome, cognome o telefono...',
    orNew: 'Oppure inserisci nuovo paziente',
    whenLabel: 'Per quando?', nameLabel: 'Nome', lastNameLabel: 'Cognome',
    phoneLabel: 'WhatsApp / Contatto', serviceLabel: 'Servizio', profLabel: 'Specialista',
    slotsLabel: 'Orari Disponibili', noSlots: 'Nessun turno disponibile.',
    reserving: 'Prenotazione...', confirm: 'FINALIZZA PRENOTAZIONE',
    cancelTitle: 'Sei sicuro di voler annullare questo appuntamento?',
    phone: 'Telefono', professional: 'Professionista', notes: 'Note di interesse',
    cancelBtn: 'Annulla Appuntamento', confirmed: 'Confermato', reminder: 'Promemoria',
    selectOption: 'Seleziona...',
    errOccupied: 'Il professionista ha già una visita prenotata in quell\'orario.',
    errNotWorking: 'Il professionista non è disponibile nell\'orario selezionato.',
    errGeneric: 'Errore durante la creazione dell\'appuntamento.',
  },
  en: {
    title: 'Virtual Calendar', subtitle: 'Total control of appointments and availability',
    newBtn: 'NEW APPOINTMENT', dailyView: 'Daily View', appointments: 'ACTIVE APPOINTMENTS',
    noActivity: 'No activity registered for today', createFirst: 'Create first appointment →',
    modalTitle: 'Schedule Appointment', modalSubtitle: 'Manual patient entry',
    searchPatient: 'Search existing patient', searchPlaceholder: 'First name, last name or phone...',
    orNew: 'Or enter new patient',
    whenLabel: 'For when?', nameLabel: 'First Name', lastNameLabel: 'Last Name',
    phoneLabel: 'WhatsApp / Contact', serviceLabel: 'Service', profLabel: 'Specialist',
    slotsLabel: 'Available Slots', noSlots: 'No slots available for the selected day.',
    reserving: 'Reserving...', confirm: 'FINALIZE BOOKING',
    cancelTitle: 'Are you sure you want to cancel this appointment?',
    phone: 'Phone', professional: 'Professional', notes: 'Notes of interest',
    cancelBtn: 'Cancel Appointment', confirmed: 'Confirmed', reminder: 'Reminder',
    selectOption: 'Select...',
    errOccupied: 'The professional already has an appointment booked for that time.',
    errNotWorking: 'The professional is not available at the selected time.',
    errGeneric: 'Error creating the appointment.',
  }
}

interface Appointment {
  id: string; status: string; start_at: string; end_at: string; notes?: string;
  clients: { id: string; first_name: string; last_name: string; phone: string } | null;
  services: { name: string } | null;
  professionals: { id: string; full_name: string } | null;
}

interface Client { id: string; first_name: string; last_name: string; phone: string; }

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose])
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 px-7 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-bottom-6 duration-300 border border-white/10
      ${type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
    </div>
  )
}

// ── Patient search autocomplete ───────────────────────────────────────────────
function PatientSearch({ tenantId, lang, onSelect }: {
  tenantId: string;
  lang: 'en' | 'es' | 'it';
  onSelect: (c: Client) => void;
}) {
  const supabase = createClient()
  const T = i18n[lang]
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Client[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('clients').select('id, first_name, last_name, phone')
        .eq('tenant_id', tenantId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(6)
      if (data) { setResults(data); setOpen(data.length > 0) }
    }, 250)
    return () => clearTimeout(timer)
  }, [query, tenantId, supabase])

  return (
    <div ref={ref} className="relative">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 block mb-2">
        {T.searchPatient}
      </label>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          placeholder={T.searchPlaceholder}
          className="w-full rounded-2xl bg-indigo-50/40 border border-indigo-100 pl-12 pr-6 py-4 text-sm font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in duration-150">
          {results.map(c => (
            <button key={c.id} onMouseDown={() => { onSelect(c); setQuery(`${c.first_name} ${c.last_name}`); setOpen(false) }}
              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-primary-50 text-left transition-colors group border-b border-gray-50 last:border-0">
              <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500 group-hover:bg-primary-600 group-hover:text-white transition-colors flex-shrink-0">
                {c.first_name.charAt(0)}{c.last_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{c.first_name} {c.last_name}</p>
                <p className="text-xs text-gray-400 truncate">{c.phone}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
function AppointmentsContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [allMonthApps, setAllMonthApps] = useState<Appointment[]>([])
  const [tenantId, setTenantId] = useState('')
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null)
  const [showNewForm, setShowNewForm] = useState(searchParams.get('new') === 'true')
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', phone: '', service_id: '', professional_id: '',
    date: format(new Date(), 'yyyy-MM-dd'), time: '', notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [slotLoading, setSlotLoading] = useState(false)
  const [lang, setLang] = useState<'en' | 'es' | 'it'>('es')
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  const T = i18n[lang] || i18n['en']
  const dateLocale = lang === 'it' ? it : (lang === 'es' ? es : enUS)
  const dayNames = lang === 'it'
    ? ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
    : (lang === 'es' ? ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])

  const initTenant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: tuData } = await supabase
      .from('tenant_users').select('tenant_id, tenants(id, settings)')
      .eq('user_id', user.id).limit(1).single()
    if (tuData?.tenants) {
      const tenant = tuData.tenants as any
      setTenantId(tenant.id)
      setLang(tenant.settings?.language || 'es')
    }
  }, [supabase])

  const fetchMeta = useCallback(async () => {
    if (!tenantId) return
    const { data: s } = await supabase.from('services').select('id, name').eq('tenant_id', tenantId).eq('active', true)
    const { data: p } = await supabase.from('professionals').select('id, full_name').eq('tenant_id', tenantId).eq('active', true)
    if (s) setServices(s); if (p) setProfessionals(p)
  }, [tenantId, supabase])

  const fetchMonthAppointments = useCallback(async () => {
    if (!tenantId) return
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase.from('appointments').select('id, status, start_at, clients(id), professionals(id)')
      .eq('tenant_id', tenantId).neq('status', 'cancelled')
      .gte('start_at', `${start}T00:00:00Z`).lte('start_at', `${end}T23:59:59Z`)
    if (data) setAllMonthApps(data as any[])
  }, [tenantId, currentMonth, supabase])

  const fetchDayAppointments = useCallback(async () => {
    if (!tenantId) return
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const { data } = await supabase.from('appointments')
      .select('id, status, start_at, end_at, notes, clients(id, first_name, last_name, phone), services(name), professionals(id, full_name)')
      .eq('tenant_id', tenantId).neq('status', 'cancelled')
      .gte('start_at', `${dateStr}T00:00:00Z`).lte('start_at', `${dateStr}T23:59:59Z`)
      .order('start_at', { ascending: true })
    if (data) setAppointments(data as any[])
  }, [tenantId, selectedDate, supabase])

  // ── fetchSlots: fixed overlap check using Date objects ──────────────────────
  const fetchSlots = useCallback(async (profId: string, dateStr: string) => {
    if (!profId || !tenantId || !dateStr) { setAvailableSlots([]); return }
    setSlotLoading(true)
    const date = parseISO(dateStr)
    const dayOfWeek = date.getDay()

    const { data: rules } = await supabase.from('availability_rules').select('*')
      .eq('tenant_id', tenantId).eq('professional_id', profId)
      .eq('day_of_week', dayOfWeek).eq('active', true)

    if (!rules || rules.length === 0) { setAvailableSlots([]); setSlotLoading(false); return }

    const { data: existingApps } = await supabase.from('appointments').select('start_at, end_at')
      .eq('tenant_id', tenantId).eq('professional_id', profId).neq('status', 'cancelled')
      .gte('start_at', `${dateStr}T00:00:00Z`).lte('start_at', `${dateStr}T23:59:59Z`)

    const slots: string[] = []
    const now = new Date()

    for (const rule of rules) {
      let current = parseISO(`${dateStr}T${rule.start_time}`)
      const endRule = parseISO(`${dateStr}T${rule.end_time}`)

      while (current < endRule) {
        const slotStart = new Date(current)
        const slotEnd = new Date(current.getTime() + 30 * 60000)

        // Skip slots in the past
        if (slotStart < now) { current = slotEnd; continue }

        // ✅ Fixed: strip 'Z' so it compares as local time instead of shifting timezone
        const isOccupied = existingApps?.some((a: any) => {
          const appStart = parseISO(a.start_at.slice(0, 19))
          const appEnd = parseISO(a.end_at.slice(0, 19))
          return appStart < slotEnd && appEnd > slotStart
        })

        if (!isOccupied) slots.push(format(slotStart, 'HH:mm'))
        current = slotEnd
      }
    }
    setAvailableSlots(slots)
    setSlotLoading(false)
  }, [tenantId, supabase])

  useEffect(() => { initTenant() }, [initTenant])
  useEffect(() => {
    if (tenantId) { fetchMonthAppointments(); fetchDayAppointments(); fetchMeta() }
  }, [tenantId, currentMonth, selectedDate, fetchMonthAppointments, fetchDayAppointments, fetchMeta])
  useEffect(() => {
    if (!tenantId) return
    const channel = supabase.channel('rt_apps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchMonthAppointments(); fetchDayAppointments()
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tenantId, fetchMonthAppointments, fetchDayAppointments, supabase])
  useEffect(() => {
    if (formData.professional_id && formData.date) fetchSlots(formData.professional_id, formData.date)
  }, [formData.professional_id, formData.date, fetchSlots])

  // ── Fill form from existing patient ──────────────────────────────────────────
  function handleSelectPatient(client: Client) {
    setFormData(prev => ({
      ...prev,
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone,
    }))
  }

  async function handleCreateAppointment() {
    setLoading(true)
    const { date, time } = formData
    const start_at = `${date}T${time}:00Z` // keeping Z to store uniformly on db
    const endFromStart = new Date(parseISO(start_at).getTime() + 30 * 60000)
    const end_at = endFromStart.toISOString()

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, ...formData, start_at, end_at })
    })

    if (res.ok) {
      setShowNewForm(false)
      setFormData({ first_name: '', last_name: '', phone: '', service_id: '', professional_id: '', date: format(selectedDate, 'yyyy-MM-dd'), time: '', notes: '' })
      fetchDayAppointments(); fetchMonthAppointments()
      // Refresh slots to reflect the newly created appointment
      if (formData.professional_id) fetchSlots(formData.professional_id, date)
      setToast({ message: lang === 'it' ? 'Appuntamento creato con successo!' : '¡Turno creado exitosamente!', type: 'success' })
    } else {
      const err = await res.json()
      const errMsg = err.error || ''
      let msg = T.errGeneric
      if (errMsg.includes('ya tiene una cita') || errMsg.includes('già una visita')) {
        msg = T.errOccupied
      } else if (errMsg.includes('no atiende') || errMsg.includes('non è disponibile')) {
        msg = T.errNotWorking
      } else if (errMsg) {
        msg = errMsg
      }
      setToast({ message: msg, type: 'error' })
    }
    setLoading(false)
  }

  async function handleCancelAppointment(id: string) {
    if (!confirm(T.cancelTitle)) return
    const res = await fetch(`/api/appointments?id=${id}`, { method: 'DELETE' })
    if (res.ok) { setSelectedApp(null); fetchDayAppointments(); fetchMonthAppointments() }
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDayOfWeek = startOfMonth(currentMonth).getDay()

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
          <LayoutDashboard className="h-48 w-48 rotate-12" />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-[-0.04em] flex items-center gap-4">
            {T.title} <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-black rounded-xl tracking-widest uppercase">Pro</span>
          </h1>
          <p className="text-base font-bold text-gray-400 mt-2 uppercase tracking-[0.2em]">{T.subtitle}</p>
        </div>
        <button onClick={() => { setFormData(prev => ({ ...prev, date: format(selectedDate, 'yyyy-MM-dd') })); setShowNewForm(true) }}
          className="relative z-10 inline-flex items-center rounded-3xl bg-gray-900 px-8 py-5 text-sm font-black text-white shadow-2xl hover:bg-primary-600 hover:scale-[1.05] active:scale-95 transition-all duration-300">
          <Plus className="-ml-1 mr-3 h-6 w-6" /> {T.newBtn}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Mini Calendar */}
        <div className="lg:col-span-4 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white p-10 shadow-lg h-fit">
          <div className="flex items-center justify-between mb-10">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-4 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 transition-all shadow-sm">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-2xl font-black text-gray-900 capitalize tracking-tight">
              {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
            </h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-4 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 transition-all shadow-sm">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-6">
            {dayNames.map(d => <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
            {days.map(day => {
              const selected = isSameDay(day, selectedDate), today = isToday(day), sameMonth = isSameMonth(day, currentMonth)
              const hasApp = allMonthApps.some(a => isSameDay(parseISO(a.start_at.slice(0, 19)), day))
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                  className={`relative aspect-square w-full flex flex-col items-center justify-center rounded-2xl text-sm font-black transition-all duration-300
                    ${selected ? 'bg-primary-600 text-white shadow-2xl shadow-primary-200 scale-110 z-10' : today ? 'bg-primary-50 text-primary-600 ring-2 ring-primary-100' : 'text-gray-600 hover:bg-gray-50'}
                    ${!sameMonth ? 'opacity-10 pointer-events-none' : ''}`}>
                  {format(day, 'd')}
                  {hasApp && !selected && <span className="absolute bottom-2 h-1 w-1 rounded-full bg-primary-400" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Day Feed */}
        <div className="lg:col-span-8 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white p-10 shadow-lg min-h-[600px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-xs font-black text-primary-600 uppercase tracking-[0.3em] mb-2">{T.dailyView}</p>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight capitalize">
                {format(selectedDate, "EEEE d 'di' MMMM", { locale: dateLocale })}
              </h2>
            </div>
            <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase shadow-lg">
              {appointments.length} {T.appointments}
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="h-32 w-32 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-8 border border-gray-100/50">
                <Calendar className="h-12 w-12 text-gray-200" />
              </div>
              <p className="text-xl font-bold text-gray-400">{T.noActivity}</p>
              <button onClick={() => setShowNewForm(true)} className="mt-6 text-sm font-black text-primary-600 hover:tracking-[0.1em] transition-all duration-300 uppercase underline-offset-4 underline">
                {T.createFirst}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appointments.map(app => (
                <button key={app.id} onClick={() => setSelectedApp(app)}
                  className="flex flex-col p-8 rounded-[2rem] border border-gray-100 bg-white/50 hover:bg-white hover:border-primary-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-500 text-left group relative backdrop-blur-md">
                  <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-3xl ${app.status === 'confirmed' ? 'bg-emerald-500' : app.status === 'awaiting_confirmation' ? 'bg-orange-500 animate-pulse' : 'bg-amber-400'}`} />
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center text-white text-xs font-black">{format(parseISO(app.start_at.slice(0, 19)), 'HH:mm')}</div>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{format(parseISO(app.end_at.slice(0, 19)), 'HH:mm')}hs</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${app.status === 'awaiting_confirmation' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {app.status === 'awaiting_confirmation' ? T.reminder : T.confirmed}
                    </span>
                  </div>
                  <p className="text-xl font-black text-gray-900 truncate mb-1 group-hover:text-primary-600 transition-colors">{app.clients?.first_name} {app.clients?.last_name}</p>
                  <p className="text-xs font-bold text-gray-400 truncate uppercase tracking-widest flex items-center gap-2">
                    <Stethoscope className="h-3 w-3" /> {app.services?.name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Detail */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-2xl animate-in fade-in duration-300" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-white" onClick={e => e.stopPropagation()}>
            <div className="p-12">
              <div className="flex items-center justify-between mb-10">
                <div className="h-20 w-20 rounded-[2rem] bg-primary-600 shadow-2xl shadow-primary-200 flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-black text-gray-900">{selectedApp.clients?.first_name} {selectedApp.clients?.last_name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-[10px] font-black rounded-lg uppercase tracking-widest">{selectedApp.services?.name}</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-black rounded-lg uppercase tracking-widest">ID: {selectedApp.id.slice(0, 8)}</span>
                  </div>
                </div>
                <div className="grid gap-4">
                  {[
                    { icon: Phone, label: T.phone, val: selectedApp.clients?.phone },
                    { icon: Briefcase, label: T.professional, val: selectedApp.professionals?.full_name },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-center gap-5 p-5 rounded-3xl bg-gray-50 border border-gray-100">
                      <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm"><Icon className="h-5 w-5" /></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                        <p className="text-sm font-bold text-gray-700">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedApp.notes && (
                  <div className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100 border-dashed text-amber-900">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> {T.notes}</p>
                    <p className="text-sm font-medium italic">"{selectedApp.notes}"</p>
                  </div>
                )}
              </div>
              <div className="mt-12">
                <button onClick={() => handleCancelAppointment(selectedApp.id)}
                  className="w-full py-5 bg-red-50 text-red-600 font-black rounded-3xl hover:bg-red-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
                  <Trash2 className="h-5 w-5" /> {T.cancelBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Appointment */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-2xl animate-in zoom-in-95 duration-300" onClick={() => setShowNewForm(false)}>
          <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] w-full max-w-2xl overflow-hidden border border-white max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-800" />
              <div className="p-10 px-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">{T.modalTitle}</h3>
                    <p className="text-sm font-bold text-primary-600 uppercase tracking-[0.2em] mt-1">{T.modalSubtitle}</p>
                  </div>
                  <button onClick={() => setShowNewForm(false)} className="h-14 w-14 bg-gray-50 rounded-3xl flex items-center justify-center hover:bg-gray-100 hover:scale-110 active:scale-95 transition-all">
                    <X className="h-6 w-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Patient search */}
                  {tenantId && (
                    <PatientSearch tenantId={tenantId} lang={lang} onSelect={handleSelectPatient} />
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{T.orNew}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{T.whenLabel}</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-5 h-5 w-5 text-gray-300" />
                      <input type="date" min={format(new Date(), 'yyyy-MM-dd')} value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value, time: '' })}
                        className="w-full rounded-[2rem] bg-indigo-50/30 border border-indigo-100 pl-14 pr-6 py-5 text-base font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none" />
                    </div>
                  </div>

                  {/* Name + Last name */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{T.nameLabel}</label>
                      <div className="relative">
                        <User className="absolute left-4 top-4 h-5 w-5 text-gray-300" />
                        <input value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                          className="w-full rounded-2xl bg-gray-50 border border-gray-100 pl-12 pr-6 py-4 text-sm font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                          placeholder={lang === 'it' ? 'Mario' : 'Ignacio'} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{T.lastNameLabel}</label>
                      <input value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full rounded-2xl bg-gray-50 border border-gray-100 px-6 py-4 text-sm font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                        placeholder={lang === 'it' ? 'Rossi' : 'Castro'} />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{T.phoneLabel}</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-4 h-5 w-5 text-gray-300" />
                      <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-2xl bg-gray-50 border border-gray-100 pl-12 pr-6 py-4 text-sm font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                        placeholder="+39 333 123 4567" />
                    </div>
                  </div>

                  {/* Service + Professional */}
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: T.serviceLabel, icon: Stethoscope, value: formData.service_id, key: 'service_id', options: services, optLabel: 'name' },
                      { label: T.profLabel, icon: Briefcase, value: formData.professional_id, key: 'professional_id', options: professionals, optLabel: 'full_name' },
                    ].map(({ label, icon: Icon, value, key, options, optLabel }) => (
                      <div key={key} className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{label}</label>
                        <div className="relative">
                          <Icon className="absolute left-4 top-4 h-5 w-5 text-gray-300 pointer-events-none" />
                          <select value={value}
                            onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value, time: key === 'professional_id' ? '' : prev.time }))}
                            className="w-full rounded-2xl bg-gray-50 border border-gray-100 pl-12 pr-10 py-4 text-sm font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none appearance-none">
                            <option value="">{T.selectOption}</option>
                            {options.map((o: any) => <option key={o.id} value={o.id}>{o[optLabel]}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Slots */}
                  {formData.professional_id && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500 bg-primary-50/20 p-8 rounded-[2.5rem] border border-primary-100/50">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em]">{T.slotsLabel}</label>
                        {slotLoading && <div className="h-4 w-4 border-2 border-primary-600 border-t-transparent animate-spin rounded-full" />}
                      </div>
                      {availableSlots.length === 0 && !slotLoading ? (
                        <div className="text-center py-4 bg-white/50 rounded-2xl border border-dashed border-orange-200">
                          <p className="text-xs font-bold text-orange-500">{T.noSlots}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-2">
                          {availableSlots.map(slot => (
                            <button key={slot} onClick={() => setFormData({ ...formData, time: slot })}
                              className={`px-4 py-3 rounded-xl text-[10px] font-black transition-all border
                                ${formData.time === slot ? 'bg-primary-600 text-white border-primary-600 shadow-xl shadow-primary-200' : 'bg-white border-gray-100 text-gray-600 hover:border-primary-300'}`}>
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={handleCreateAppointment}
                    disabled={loading || !formData.first_name || !formData.professional_id || !formData.time}
                    className="w-full py-6 rounded-[2rem] bg-gray-900 text-white font-black text-lg hover:bg-primary-600 shadow-2xl hover:shadow-primary-300 transition-all duration-500 mt-4 uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? T.reserving : T.confirm}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="p-10 font-bold text-gray-500 animate-pulse">Cargando agenda...</div>}>
      <AppointmentsContent />
    </Suspense>
  )
}
