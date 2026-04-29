"use client"

import { useState, Suspense } from 'react'
import { Plus, LayoutDashboard, Phone, Clock, ChevronRight, CalendarDays, ListOrdered, Calendar, ArrowRight, Zap, Target, Activity, ShieldCheck, Layers } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useAppointments, Appointment } from '@/hooks/useAppointments'
import { MiniCalendar } from '@/components/appointments/MiniCalendar'
import { DayActivityFeed } from '@/components/appointments/DayActivityFeed'
import { AppointmentDetailModal } from '@/components/appointments/AppointmentDetailModal'
import { NewAppointmentModal } from '@/components/appointments/NewAppointmentModal'
import { translations, dateLocales } from '@/lib/i18n'
import WaitlistView from '@/components/dashboard/WaitlistView'
import { motion, AnimatePresence } from 'framer-motion'

function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  const [visible, setVisible] = useState(true)
  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-6 px-10 py-6 rounded-[2.5rem] shadow-spatial text-white text-sm font-black uppercase tracking-widest border border-white/10 backdrop-blur-2xl
            ${type === 'error' ? 'bg-error' : 'bg-primary'}`}>
          <span>{message}</span>
          <button onClick={() => { setVisible(false); onClose() }} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">✕</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
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
    markAsNotified,
    pendingCalls,
    notifyingId,
    refresh
  } = useAppointments()

  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [callNotes, setCallNotes] = useState<{[key: string]: string}>({})
  const [activeTab, setActiveTab] = useState<'calendar' | 'waitlist'>('calendar')

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
      <div className="h-[70vh] flex flex-col items-center justify-center">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent animate-spin rounded-full mb-8" />
        <p className="text-on-surface/30 font-black animate-pulse uppercase tracking-[0.4em] text-[10px]">Synchronizing Matrix...</p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-surface py-editorial-tight md:py-editorial overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-6 md:px-editorial">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Editorial Header */}
        <header className="mb-20 md:mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-4 mb-8">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.4em]">Resource Scheduler • {format(new Date(), 'MMM dd, yyyy')}</p>
            </div>
            <h1 className="precision-header max-w-4xl">
              Chronos <br />
              <span className="text-primary/20 italic font-medium">Precision</span>
            </h1>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mt-12">
               <div className="flex items-center bg-surface-container-low rounded-full p-2 gap-2 border border-on-surface/5">
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className={`px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
                      activeTab === 'calendar' ? 'bg-primary text-white shadow-spatial' : 'text-on-surface/40 hover:text-on-surface'
                    }`}
                  >
                    Calendar
                  </button>
                  <button
                    onClick={() => setActiveTab('waitlist')}
                    className={`px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
                      activeTab === 'waitlist' ? 'bg-primary text-white shadow-spatial' : 'text-on-surface/40 hover:text-on-surface'
                    }`}
                  >
                    Waitlist
                  </button>
               </div>

               <div className="flex items-center gap-6">
                  {activeTab === 'calendar' && (
                    <button onClick={() => setShowNewForm(true)}
                      className="precision-button-primary flex items-center gap-6 group py-6 px-12">
                      <span className="text-lg">Schedule Event</span>
                      <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform" />
                    </button>
                  )}
               </div>
            </div>
          </motion.div>
        </header>

        {/* Pending Notifications Alert */}
        <AnimatePresence>
          {pendingCalls.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="asymmetric-layout mb-20 overflow-hidden"
            >
              <div className="precision-surface-lowest border-l-8 border-l-error p-10 md:p-16">
                 <div className="flex items-center justify-between mb-12">
                    <div>
                       <div className="flex items-center gap-4 mb-4">
                          <Activity className="h-6 w-6 text-error animate-pulse" />
                          <h3 className="text-2xl font-black text-on-surface tracking-tighter uppercase">Operational Interruptions</h3>
                       </div>
                       <p className="precision-subheader text-on-surface/40 max-w-lg">
                         System detected {pendingCalls.length} cancellations that require immediate patient synchronization.
                       </p>
                    </div>
                    <div className="h-20 w-20 rounded-full border-4 border-error/20 flex items-center justify-center text-error font-black text-3xl">
                       {pendingCalls.length}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pendingCalls.map(call => (
                      <div key={call.id} className="bg-surface p-10 rounded-[3rem] border border-transparent hover:border-error/20 transition-all group">
                         <div className="flex items-center gap-6 mb-8">
                            <div className="h-16 w-16 rounded-[2rem] bg-error/5 flex items-center justify-center text-error font-black text-xl">
                               {call.clients?.first_name[0]}
                            </div>
                            <div>
                               <p className="text-xl font-black text-on-surface leading-none mb-2">{call.clients?.first_name} {call.clients?.last_name}</p>
                               <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">{call.clients?.phone}</p>
                            </div>
                         </div>
                         <input 
                            type="text"
                            placeholder="Add precision notes..."
                            value={callNotes[call.id] || ''}
                            onChange={(e) => setCallNotes(prev => ({ ...prev, [call.id]: e.target.value }))}
                            className="w-full bg-on-surface/5 border-none rounded-2xl px-6 py-4 text-xs font-bold text-on-surface placeholder:text-on-surface/20 outline-none mb-8"
                         />
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest">
                               {format(parseISO(call.start_at), "MMM dd, HH:mm")}
                            </span>
                            <button 
                               onClick={() => markAsNotified(call.id, callNotes[call.id])}
                               disabled={notifyingId === call.id}
                               className="h-14 px-8 rounded-full bg-error text-white text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all flex items-center gap-3"
                            >
                               {notifyingId === call.id ? <Clock className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                               Synchronized
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {activeTab === 'calendar' ? (
          <section className="asymmetric-layout grid grid-cols-1 xl:grid-cols-12 gap-16 items-start">
            {/* Left: Mini Calendar Control */}
            <div className="xl:col-span-4 sticky top-12">
               <div className="precision-surface-lowest p-4 md:p-8 rounded-[4rem]">
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

               {/* Activity Insights */}
               <div className="mt-12 precision-surface-lowest p-10 bg-primary text-white rounded-[3rem] overflow-hidden group">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                     <Target className="h-3 w-3" /> Scheduling Logic
                  </p>
                  <h4 className="text-2xl font-black tracking-tighter leading-tight mb-8">
                     {allMonthApps.length} events detected for this period. Matrix is <span className="text-white/40 italic">stable</span>.
                  </h4>
                  <button className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] hover:translate-x-2 transition-transform">
                     View Efficiency Report <ArrowRight className="h-4 w-4" />
                  </button>
               </div>
            </div>

            {/* Right: Detailed Day Matrix */}
            <div className="xl:col-span-8">
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
          </section>
        ) : (
          tenantId && (
            <section className="asymmetric-layout">
               <div className="precision-surface-lowest rounded-[4rem] p-10 md:p-20">
                  <WaitlistView tenantId={tenantId} lang={lang} />
               </div>
            </section>
          )
        )}
      </div>

      {/* High-Fidelity Modals */}
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
    <Suspense fallback={
      <div className="h-screen flex flex-col items-center justify-center bg-surface">
         <div className="h-12 w-12 border-4 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    }>
      <AppointmentsContent />
    </Suspense>
  )
}
