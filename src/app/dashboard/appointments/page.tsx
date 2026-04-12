"use client"

import { useState, Suspense } from 'react'
import { Plus, LayoutDashboard } from 'lucide-react'
import { format } from 'date-fns'
import { useAppointments, Appointment } from '@/hooks/useAppointments'
import { MiniCalendar } from '@/components/appointments/MiniCalendar'
import { DayActivityFeed } from '@/components/appointments/DayActivityFeed'
import { AppointmentDetailModal } from '@/components/appointments/AppointmentDetailModal'
import { NewAppointmentModal } from '@/components/appointments/NewAppointmentModal'
import { translations, dateLocales } from '@/lib/i18n'

function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  const [visible, setVisible] = useState(true)
  return visible ? (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 px-7 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-bottom-6 duration-300 border border-white/10
      ${type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
      <span>{message}</span>
      <button onClick={() => { setVisible(false); onClose() }} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  ) : null
}

function AppointmentsContent() {
  const {
    appointments,
    allMonthApps,
    selectedDate,
    currentMonth,
    tenantId,
    services,
    professionals,
    availableSlots,
    slotLoading,
    lang,
    loading,
    setSelectedDate,
    navigateMonth,
    fetchSlots,
    cancelAppointment,
    refresh
  } = useAppointments()

  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  const T = translations[lang] || translations['en']
  const dayNames = lang === 'it'
    ? ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
    : (lang === 'es' ? ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])

  const handleCancel = async (id: string) => {
    if (!confirm(T.cancel_title)) return
    const ok = await cancelAppointment(id)
    if (ok) {
        setSelectedApp(null)
        setToast({ message: lang === 'it' ? 'Appuntamento annullato' : 'Cita cancelada', type: 'success' })
    }
  }

  if (loading && !tenantId) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary-600 border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/70 backdrop-blur-xl p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
          <LayoutDashboard className="h-32 md:h-48 w-32 md:w-48 rotate-12" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-[-0.04em] flex items-center gap-3 md:gap-4">
            {T.nav_calendar} <span className="px-2 md:px-3 py-1 bg-primary-100 text-primary-700 text-[10px] md:text-xs font-black rounded-lg md:rounded-xl tracking-widest uppercase">Pro</span>
          </h1>
          <p className="text-xs md:text-base font-bold text-gray-400 mt-1 md:mt-2 uppercase tracking-[0.2em]">{T.patient_management_subtitle}</p>
        </div>
        <button onClick={() => setShowNewForm(true)}
          className="relative z-10 flex items-center justify-center rounded-2xl md:rounded-3xl bg-gray-900 px-6 md:px-8 py-4 md:py-5 text-sm font-black text-white shadow-2xl hover:bg-primary-600 hover:scale-[1.05] active:scale-95 transition-all duration-300 w-full md:w-auto">
          <Plus className="-ml-1 mr-2 md:mr-3 h-5 md:h-6 w-5 md:w-6" /> {T.new_appointment}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        {/* Mini Calendar */}
        <div className="lg:col-span-4">
            <MiniCalendar 
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onNavigate={navigateMonth}
                appointments={allMonthApps}
                locale={dateLocales[lang]}
                dayNames={dayNames}
            />
        </div>

        {/* Day Feed */}
        <DayActivityFeed 
            selectedDate={selectedDate}
            appointments={appointments}
            translations={{
                dailyView: T.daily_view,
                appointments: T.appointments_list,
                noActivity: T.no_activity_today,
                createFirst: T.create_first,
                reminder: T.awaiting,
                confirmed: T.confirmed,
            }}
            locale={dateLocales[lang]}
            onSelectAppointment={setSelectedApp}
            onNewAppointment={() => setShowNewForm(true)}
            lang={lang}
        />
      </div>

      {/* Modals */}
      {selectedApp && (
        <AppointmentDetailModal 
            appointment={selectedApp}
            onClose={() => setSelectedApp(null)}
            onCancel={handleCancel}
            translations={{
                phone: T.phone,
                professional: T.professional,
                notes: T.notes,
                cancelBtn: T.cancel_btn,
                cancelTitle: T.cancel_title
            }}
        />
      )}

      {showNewForm && tenantId && (
        <NewAppointmentModal 
            tenantId={tenantId}
            lang={lang}
            services={services}
            professionals={professionals}
            onClose={() => setShowNewForm(false)}
            onSuccess={() => {
                refresh()
                setToast({ message: lang === 'it' ? 'Appuntamento creato!' : '¡Turno creado!', type: 'success' })
            }}
            selectedDate={selectedDate}
            translations={{
                modalTitle: T.schedule_appointment,
                modalSubtitle: T.manual_entry,
                searchPatient: T.search_patient,
                searchPlaceholder: T.search_placeholder,
                orNew: T.or_new_patient,
                whenLabel: T.when,
                nameLabel: T.name,
                lastNameLabel: T.last_name,
                phoneLabel: T.phone,
                serviceLabel: T.service,
                profLabel: T.professional,
                slotsLabel: T.available_slots,
                noSlots: T.no_slots,
                reserving: T.reserving,
                confirm: T.confirm_booking,
                ready: T.ready,
                errGeneric: T.err_generic,
                selectOption: lang === 'es' ? 'Selecciona...' : (lang === 'it' ? 'Seleziona...' : 'Select...')
            }}
            availableSlots={availableSlots}
            slotLoading={slotLoading}
            onFetchSlots={fetchSlots}
        />
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
